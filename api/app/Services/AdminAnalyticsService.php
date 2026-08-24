<?php

namespace App\Services;

use PDO;

class AdminAnalyticsService
{
    /** @var PDO */
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * @return array<string, mixed>
     */
    public function overview(): array
    {
        $usersTotal = $this->count('SELECT COUNT(*) FROM users');
        $usersActive = $this->count("SELECT COUNT(*) FROM users WHERE status = 'active'");
        $usersThisMonth = $this->count(
            "SELECT COUNT(*) FROM users WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')"
        );
        $usersLastMonth = $this->count(
            "SELECT COUNT(*) FROM users
             WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
               AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')"
        );

        $dashboards = $this->count('SELECT COUNT(*) FROM dashboards');
        $dashboardsThisMonth = $this->count(
            "SELECT COUNT(*) FROM dashboards WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')"
        );
        $dashboardsLastMonth = $this->count(
            "SELECT COUNT(*) FROM dashboards
             WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
               AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')"
        );

        $reports = $this->count('SELECT COUNT(*) FROM ai_reports');
        $conversations = $this->count('SELECT COUNT(*) FROM ai_conversations');
        $insights = $reports + $conversations;
        $reportsThisMonth = $this->count(
            "SELECT COUNT(*) FROM ai_reports WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')"
        );
        $conversationsThisMonth = $this->count(
            "SELECT COUNT(*) FROM ai_conversations WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')"
        );
        $insightsThisMonth = $reportsThisMonth + $conversationsThisMonth;
        $reportsLastMonth = $this->count(
            "SELECT COUNT(*) FROM ai_reports
             WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
               AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')"
        );
        $conversationsLastMonth = $this->count(
            "SELECT COUNT(*) FROM ai_conversations
             WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
               AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')"
        );
        $insightsLastMonth = $reportsLastMonth + $conversationsLastMonth;

        $usageRate = $usersTotal > 0 ? round(($usersActive / $usersTotal) * 100) : 0;

        $dashboardViews = $this->count('SELECT COALESCE(SUM(views_count), 0) FROM dashboard_meta');
        $reportViews = $this->count('SELECT COALESCE(SUM(views_count), 0) FROM ai_reports');
        $favorites = $this->count('SELECT COUNT(*) FROM dashboard_favorites');
        $alertsActive = $this->count('SELECT COUNT(*) FROM alerts WHERE is_read = 0');
        $avgDashboardViews = $dashboards > 0 ? round($dashboardViews / $dashboards, 1) : 0;

        $daysWithReports = max(1, $this->count(
            'SELECT COUNT(DISTINCT DATE(created_at)) FROM ai_reports'
        ));
        $reportsPerDay = round($reports / $daysWithReports, 1);

        return [
            'kpis' => [
                'users_active' => $usersActive,
                'users_total' => $usersTotal,
                'users_delta' => $this->delta($usersThisMonth, $usersLastMonth),
                'dashboards' => $dashboards,
                'dashboards_delta' => $this->delta($dashboardsThisMonth, $dashboardsLastMonth),
                'insights' => $insights,
                'insights_delta' => $this->delta($insightsThisMonth, $insightsLastMonth),
                'usage_rate' => $usageRate,
            ],
            'monthly' => $this->monthlyGrowth(),
            'weekly' => $this->weeklyActivity(),
            'categories' => $this->dashboardCategories(),
            'details' => [
                'dashboard_views' => $dashboardViews,
                'report_views' => $reportViews,
                'avg_dashboard_views' => $avgDashboardViews,
                'favorites' => $favorites,
                'reports' => $reports,
                'conversations' => $conversations,
                'reports_per_day' => $reportsPerDay,
                'alerts_active' => $alertsActive,
            ],
        ];
    }

    /**
     * @return list<array{month:string,label:string,dashboards:int,insights:int}>
     */
    private function monthlyGrowth(): array
    {
        $items = [];
        for ($i = 5; $i >= 0; $i--) {
            $start = new \DateTimeImmutable('first day of this month');
            $start = $start->modify("-{$i} months");
            $end = $start->modify('first day of next month');
            $key = $start->format('Y-m');

            $items[$key] = [
                'month' => $key,
                'label' => $this->monthLabel($start),
                'dashboards' => 0,
                'insights' => 0,
            ];
        }

        $from = (new \DateTimeImmutable('first day of this month'))->modify('-5 months')->format('Y-m-d');

        $dashStmt = $this->db->prepare(
            "SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS total
             FROM dashboards
             WHERE created_at >= :from
             GROUP BY ym"
        );
        $dashStmt->execute(['from' => $from]);
        foreach ($dashStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $ym = (string) $row['ym'];
            if (isset($items[$ym])) {
                $items[$ym]['dashboards'] = (int) $row['total'];
            }
        }

        $repStmt = $this->db->prepare(
            "SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS total
             FROM ai_reports
             WHERE created_at >= :from
             GROUP BY ym"
        );
        $repStmt->execute(['from' => $from]);
        foreach ($repStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $ym = (string) $row['ym'];
            if (isset($items[$ym])) {
                $items[$ym]['insights'] += (int) $row['total'];
            }
        }

        $convStmt = $this->db->prepare(
            "SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS total
             FROM ai_conversations
             WHERE created_at >= :from
             GROUP BY ym"
        );
        $convStmt->execute(['from' => $from]);
        foreach ($convStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $ym = (string) $row['ym'];
            if (isset($items[$ym])) {
                $items[$ym]['insights'] += (int) $row['total'];
            }
        }

        return array_values($items);
    }

    /**
     * @return list<array{name:string,date:string,dashboards:int,insights:int}>
     */
    private function weeklyActivity(): array
    {
        $labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        $items = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = (new \DateTimeImmutable('today'))->modify("-{$i} days");
            $date = $day->format('Y-m-d');
            $items[$date] = [
                'name' => $labels[(int) $day->format('w')],
                'date' => $date,
                'dashboards' => 0,
                'insights' => 0,
            ];
        }

        $from = (new \DateTimeImmutable('today'))->modify('-6 days')->format('Y-m-d');

        $dashStmt = $this->db->prepare(
            "SELECT DATE(created_at) AS d, COUNT(*) AS total
             FROM dashboards
             WHERE created_at >= :from
             GROUP BY d"
        );
        $dashStmt->execute(['from' => $from]);
        foreach ($dashStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $d = (string) $row['d'];
            if (isset($items[$d])) {
                $items[$d]['dashboards'] = (int) $row['total'];
            }
        }

        $insStmt = $this->db->prepare(
            "SELECT DATE(created_at) AS d, COUNT(*) AS total
             FROM (
                SELECT created_at FROM ai_reports WHERE created_at >= :from1
                UNION ALL
                SELECT created_at FROM ai_conversations WHERE created_at >= :from2
             ) t
             GROUP BY d"
        );
        $insStmt->execute(['from1' => $from, 'from2' => $from]);
        foreach ($insStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $d = (string) $row['d'];
            if (isset($items[$d])) {
                $items[$d]['insights'] = (int) $row['total'];
            }
        }

        return array_values($items);
    }

    /**
     * @return list<array{name:string,value:int,color:string}>
     */
    private function dashboardCategories(): array
    {
        $labels = [
            'commercial' => ['Comercial', '#5b5bd6'],
            'marketing' => ['Marketing', '#06b6d4'],
            'finance' => ['Financeiro', '#10b981'],
            'hr' => ['RH', '#f59e0b'],
            'operations' => ['Operações', '#8b5cf6'],
            'other' => ['Outros', '#ef4444'],
        ];

        $stmt = $this->db->query(
            "SELECT COALESCE(m.category, 'other') AS category, COUNT(*) AS total
             FROM dashboards d
             LEFT JOIN dashboard_meta m ON m.dashboard_id = d.id
             GROUP BY COALESCE(m.category, 'other')"
        );
        $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

        $items = [];
        foreach ($rows as $row) {
            $key = strtolower((string) $row['category']);
            if (!isset($labels[$key])) {
                $key = 'other';
            }
            $label = $labels[$key][0];
            $color = $labels[$key][1];
            if (!isset($items[$label])) {
                $items[$label] = ['name' => $label, 'value' => 0, 'color' => $color];
            }
            $items[$label]['value'] += (int) $row['total'];
        }

        if ($items === []) {
            return [['name' => 'Sem dashboards', 'value' => 1, 'color' => '#a1a1aa']];
        }

        return array_values($items);
    }

    private function count(string $sql): int
    {
        $stmt = $this->db->query($sql);

        return (int) ($stmt ? $stmt->fetchColumn() : 0);
    }

    private function delta(int $current, int $previous): int
    {
        if ($previous === 0) {
            return $current > 0 ? 100 : 0;
        }

        return (int) round((($current - $previous) / $previous) * 100);
    }

    private function monthLabel(\DateTimeImmutable $date): string
    {
        $months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        return $months[(int) $date->format('n') - 1];
    }
}
