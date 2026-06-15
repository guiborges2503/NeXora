<?php

namespace App\Repositories;

use PDO;

class AiReportRepository
{
    /** @var PDO */
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listVisibleForUser(int $userId, string $userRole): array
    {
        $stmt = $this->db->prepare(
            "SELECT
                r.id,
                r.title AS name,
                r.description,
                r.owner_id,
                COALESCE(u.name, 'Sistema') AS owner_name,
                r.category,
                r.chart_type,
                r.is_public,
                r.views_count,
                r.created_at,
                r.updated_at,
                'ai_report' AS report_type
             FROM ai_reports r
             LEFT JOIN users u ON u.id = r.owner_id
             WHERE
                r.owner_id = :user_id
                OR r.is_public = 1
                OR EXISTS (
                    SELECT 1
                    FROM ai_report_role_access ara
                    INNER JOIN roles ro ON ro.id = ara.role_id
                    WHERE ara.report_id = r.id AND ro.name = :role
                )
             ORDER BY datetime(r.updated_at) DESC"
        );
        $stmt->execute([
            'user_id' => $userId,
            'role' => $userRole,
        ]);

        $rows = $stmt->fetchAll() ?: [];
        foreach ($rows as &$row) {
            $row['allowed_roles'] = $this->getAllowedRoles((int) $row['id']);
        }

        return $rows;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT
                r.id,
                r.owner_id,
                r.title,
                r.description,
                r.category,
                r.chart_type,
                r.sql_query,
                r.x_key,
                r.y_key,
                r.definition_json,
                r.prompt_summary,
                r.is_public,
                r.views_count,
                r.created_at,
                r.updated_at,
                COALESCE(u.name, 'Sistema') AS owner_name
             FROM ai_reports r
             LEFT JOIN users u ON u.id = r.owner_id
             WHERE r.id = :id
             LIMIT 1"
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        $row['allowed_roles'] = $this->getAllowedRoles($id);
        $row['definition'] = json_decode((string) ($row['definition_json'] ?? '{}'), true) ?: [];

        return $row;
    }

    public function canUserAccess(array $report, int $userId, string $userRole): bool
    {
        if ((int) ($report['owner_id'] ?? 0) === $userId) {
            return true;
        }

        if ((int) ($report['is_public'] ?? 0) === 1) {
            return true;
        }

        $allowedRoles = $report['allowed_roles'] ?? $this->getAllowedRoles((int) ($report['id'] ?? 0));

        return in_array($userRole, $allowedRoles, true);
    }

    /**
     * @param array<string, mixed> $definition
     */
    public function create(
        int $ownerId,
        array $definition,
        string $promptSummary,
        int $isPublic,
        array $allowedRoles
    ): int {
        $now = date('Y-m-d H:i:s');
        $fields = $this->definitionToRowFields($definition, $promptSummary, $isPublic);

        $stmt = $this->db->prepare(
            "INSERT INTO ai_reports (
                owner_id, title, description, category, chart_type, sql_query,
                x_key, y_key, definition_json, prompt_summary, is_public,
                views_count, created_at, updated_at
             ) VALUES (
                :owner_id, :title, :description, :category, :chart_type, :sql_query,
                :x_key, :y_key, :definition_json, :prompt_summary, :is_public,
                0, :created_at, :updated_at
             )"
        );

        $stmt->execute(array_merge(['owner_id' => $ownerId], $fields, [
            'created_at' => $now,
            'updated_at' => $now,
        ]));

        $reportId = (int) $this->db->lastInsertId();
        $this->setAllowedRoles($reportId, $allowedRoles);

        return $reportId;
    }

    /**
     * @param array<string, mixed> $definition
     */
    public function updateDefinition(
        int $id,
        array $definition,
        string $promptSummary,
        int $isPublic,
        array $allowedRoles
    ): bool {
        $fields = $this->definitionToRowFields($definition, $promptSummary, $isPublic);

        $stmt = $this->db->prepare(
            "UPDATE ai_reports
             SET title = :title,
                 description = :description,
                 category = :category,
                 chart_type = :chart_type,
                 sql_query = :sql_query,
                 x_key = :x_key,
                 y_key = :y_key,
                 definition_json = :definition_json,
                 prompt_summary = :prompt_summary,
                 is_public = :is_public,
                 updated_at = :updated_at
             WHERE id = :id"
        );

        $ok = $stmt->execute(array_merge(['id' => $id], $fields, [
            'updated_at' => date('Y-m-d H:i:s'),
        ]));

        $this->setAllowedRoles($id, $allowedRoles);

        return $ok;
    }

    public function updateSharing(int $id, int $isPublic, array $allowedRoles): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE ai_reports
             SET is_public = :is_public, updated_at = :updated_at
             WHERE id = :id"
        );
        $ok = $stmt->execute([
            'id' => $id,
            'is_public' => $isPublic,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $this->setAllowedRoles($id, $allowedRoles);

        return $ok;
    }

    public function deleteById(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM ai_reports WHERE id = :id');

        return $stmt->execute(['id' => $id]);
    }

    public function incrementViews(int $id): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE ai_reports SET views_count = views_count + 1, updated_at = :updated_at WHERE id = :id'
        );

        return $stmt->execute([
            'id' => $id,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * @param array<string, mixed> $definition
     * @return array<string, mixed>
     */
    private function definitionToRowFields(array $definition, string $promptSummary, int $isPublic): array
    {
        $definitionJson = json_encode($definition, JSON_UNESCAPED_UNICODE);
        if ($definitionJson === false) {
            $definitionJson = '{}';
        }

        $firstWidget = $definition['widgets'][0] ?? null;
        $isDashboard = ($definition['layout'] ?? '') === 'dashboard' && is_array($firstWidget);

        return [
            'title' => (string) ($definition['title'] ?? 'Relatório'),
            'description' => (string) ($definition['description'] ?? ''),
            'category' => (string) ($definition['category'] ?? 'commercial'),
            'chart_type' => $isDashboard ? 'dashboard' : (string) ($definition['chart_type'] ?? 'bar'),
            'sql_query' => $isDashboard ? (string) ($firstWidget['sql'] ?? '') : (string) ($definition['sql'] ?? ''),
            'x_key' => $isDashboard ? (string) ($firstWidget['x_key'] ?? '') : (string) ($definition['x_key'] ?? ''),
            'y_key' => $isDashboard ? (string) ($firstWidget['y_key'] ?? '') : (string) ($definition['y_key'] ?? ''),
            'definition_json' => $definitionJson,
            'prompt_summary' => $promptSummary,
            'is_public' => $isPublic,
        ];
    }

    /**
     * @return string[]
     */
    private function getAllowedRoles(int $reportId): array
    {
        $stmt = $this->db->prepare(
            "SELECT r.name
             FROM ai_report_role_access ara
             INNER JOIN roles r ON r.id = ara.role_id
             WHERE ara.report_id = :report_id
             ORDER BY r.name ASC"
        );
        $stmt->execute(['report_id' => $reportId]);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

        return $rows ?: [];
    }

    /**
     * @param string[] $allowedRoles
     */
    private function setAllowedRoles(int $reportId, array $allowedRoles): void
    {
        $this->db->prepare('DELETE FROM ai_report_role_access WHERE report_id = :report_id')
            ->execute(['report_id' => $reportId]);

        $allowed = array_values(array_unique(array_filter($allowedRoles, function ($role) {
            return in_array($role, ['admin', 'manager', 'viewer'], true);
        })));

        if (empty($allowed)) {
            $allowed = ['admin', 'manager', 'viewer'];
        }

        $roleStmt = $this->db->prepare('SELECT id FROM roles WHERE name = :name LIMIT 1');
        $insertStmt = $this->db->prepare(
            'INSERT INTO ai_report_role_access (report_id, role_id, granted_at)
             VALUES (:report_id, :role_id, :granted_at)'
        );

        foreach ($allowed as $roleName) {
            $roleStmt->execute(['name' => $roleName]);
            $roleId = (int) $roleStmt->fetchColumn();
            if ($roleId <= 0) {
                continue;
            }

            $insertStmt->execute([
                'report_id' => $reportId,
                'role_id' => $roleId,
                'granted_at' => date('Y-m-d H:i:s'),
            ]);
        }
    }
}
