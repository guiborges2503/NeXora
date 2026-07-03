<?php

namespace App\Support;

final class RoleCatalog
{
    /** @var array<string, array{label: string, description: string}> */
    private const ROLES = [
        'admin' => [
            'label' => 'Administrador',
            'description' => 'Acesso total ao sistema',
        ],
        'manager' => [
            'label' => 'Gestor',
            'description' => 'Gerencia usuários e dashboards',
        ],
        'viewer' => [
            'label' => 'Visualizador',
            'description' => 'Acesso somente leitura',
        ],
    ];

    /** @return list<string> */
    public static function ids(): array
    {
        return array_keys(self::ROLES);
    }

    public static function label(string $role): string
    {
        return self::ROLES[$role]['label'] ?? ucfirst($role);
    }

    public static function description(string $role): string
    {
        return self::ROLES[$role]['description'] ?? '';
    }

    public static function isValid(string $role): bool
    {
        return isset(self::ROLES[$role]);
    }
}
