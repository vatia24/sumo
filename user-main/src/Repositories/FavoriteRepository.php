<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use App\Utils\Pagination;
use PDO;

final class FavoriteRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function add(int $userId, int $discountId): bool
    {
        $stmt = $this->db->prepare('INSERT IGNORE INTO favorites (user_id, discount_id, created_at) VALUES (?, ?, NOW())');
        return $stmt->execute([$userId, $discountId]);
    }

    public function remove(int $userId, int $discountId): bool
    {
        $stmt = $this->db->prepare('DELETE FROM favorites WHERE user_id = ? AND discount_id = ?');
        return $stmt->execute([$userId, $discountId]);
    }

    public function listByUser(int $userId, int $limit = 20, ?string $cursor = null): array
    {
        $params = [$userId];
        $where = ['f.user_id = ?'];
        if ($cursor) {
            $decoded = Pagination::decodeCursor($cursor);
            if ($decoded) {
                $where[] = '(f.created_at, f.id) < (? , ?)';
                [$createdAt, $id] = explode('|', $decoded);
                $params[] = $createdAt;
                $params[] = (int)$id;
            }
        }
        $whereSql = 'WHERE ' . implode(' AND ', $where);
        $sql = "SELECT f.*, d.title, d.description, d.price, d.old_price, d.is_active FROM favorites f INNER JOIN discounts d ON d.id = f.discount_id $whereSql ORDER BY f.created_at DESC, f.id DESC LIMIT ".$limit;
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
}


