<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use App\Utils\Pagination;
use PDO;

final class StoreRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function list(array $filters, int $limit = 20, ?string $cursor = null): array
    {
        $params = [];
        $where = [];
        $selectDistance = '';
        if (!empty($filters['q'])) {
            $where[] = '(c.full_name LIKE ? OR c.city LIKE ?)';
            $q = '%' . $filters['q'] . '%';
            $params[] = $q; $params[] = $q;
        }
        if (!empty($filters['category'])) {
            // Note: companies table may not have category; keep placeholder mapping if added later
            $where[] = '1=1';
        }
        $having = '';
        if (!empty($filters['lat']) && !empty($filters['lng']) && !empty($filters['radius'])) {
            $lat = (float)$filters['lat'];
            $lng = (float)$filters['lng'];
            $radius = (float)$filters['radius'];
            $selectDistance = ", (6371 * acos(cos(radians($lat)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians($lng)) + sin(radians($lat)) * sin(radians(c.latitude)))) as distance";
            $having = 'HAVING distance <= ' . $radius;
        }
        if ($cursor) {
            $decoded = Pagination::decodeCursor($cursor);
            if ($decoded) {
                $where[] = '(s.created_at, s.id) < (? , ?)';
                [$createdAt, $id] = explode('|', $decoded);
                $params[] = $createdAt;
                $params[] = (int)$id;
            }
        }
        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
        // Align to dailyhub-main: stores live under companies/branches/product tables; fallback to companies as stores
        $sql = "SELECT c.id, c.full_name as name, c.city as address, c.latitude as lat, c.longitude as lng, c.status, c.logo_url as image_url $selectDistance FROM companies c $whereSql ORDER BY c.id DESC $having LIMIT ".$limit;
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        $nextCursor = null;
        if (count($rows) === $limit) {
            $last = end($rows);
            $nextCursor = Pagination::encodeCursor(($last['created_at'] ?? '') . '|' . (string)$last['id']);
        }
        return ['items' => $rows, 'nextCursor' => $nextCursor];
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT c.id, c.full_name as name, c.city as address, c.latitude as lat, c.longitude as lng, c.status, c.logo_url as image_url FROM companies c WHERE c.id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}


