<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use PDO;

final class CategoryRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function list(array $filters): array
    {
        $where = [];
        $params = [];
        if (array_key_exists('parent_id', $filters)) {
            if ($filters['parent_id'] === null) {
                $where[] = 'c.parent_id IS NULL';
            } else {
                $where[] = 'c.parent_id = ?';
                $params[] = (int)$filters['parent_id'];
            }
        }
        if (!empty($filters['q'])) {
            $where[] = '(c.name LIKE ? OR c.slug LIKE ?)';
            $q = '%' . $filters['q'] . '%';
            $params[] = $q; $params[] = $q;
        }
        $limit = isset($filters['limit']) ? max(1, min((int)$filters['limit'], 500)) : 100;
        $offset = isset($filters['offset']) ? max(0, (int)$filters['offset']) : 0;
        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
        $sql = 'SELECT c.id, c.name, c.slug, c.parent_id, c.image_path FROM category c ' . $whereSql . ' ORDER BY c.parent_id IS NOT NULL, c.parent_id, c.name ASC LIMIT ' . $limit . ' OFFSET ' . $offset;
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll() ?: [];
    }

    public function all(): array
    {
        $sql = 'SELECT c.id, c.name, c.slug, c.parent_id, c.image_path FROM category c ORDER BY c.parent_id IS NOT NULL, c.parent_id, c.name ASC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll() ?: [];
    }
}


