<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Config\Database;
use App\Utils\Pagination;
use PDO;

final class DiscountRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    public function list(array $filters, int $limit = 20, ?string $cursor = null): array
    {
        $params = [];
        // dailyhub-main uses table `discount` with status and dates
        $where = ['(d.status = "active")', '(d.start_date IS NULL OR d.start_date <= CURDATE())', '(d.end_date IS NULL OR d.end_date >= CURDATE())'];
        if (!empty($filters['minDiscount'])) { $where[] = 'd.discount_percent >= ?'; $params[] = (int)$filters['minDiscount']; }
        if (!empty($filters['maxDiscount'])) { $where[] = 'd.discount_percent <= ?'; $params[] = (int)$filters['maxDiscount']; }
        if (!empty($filters['expiresSoon'])) { $where[] = '(d.end_date IS NOT NULL AND d.end_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY))'; }
        if (!empty($filters['isUrgent'])) { $where[] = '(d.end_date IS NOT NULL AND d.end_date <= DATE_ADD(CURDATE(), INTERVAL 1 DAY))'; }
        // price filters via product.price
        if (!empty($filters['minPrice'])) { $where[] = 'p.price >= ?'; $params[] = (float)$filters['minPrice']; }
        if (!empty($filters['maxPrice'])) { $where[] = 'p.price <= ?'; $params[] = (float)$filters['maxPrice']; }
        // Category filter via product_category join
        $join = '';
        if (!empty($filters['category'])) {
            $join = ' INNER JOIN product_category pc ON pc.product_id = p.id INNER JOIN category c ON c.id = pc.category_id';
            if (is_numeric($filters['category'])) {
                $where[] = 'pc.category_id = ?';
                $params[] = (int)$filters['category'];
            } else {
                $where[] = 'c.slug = ?';
                $params[] = (string)$filters['category'];
            }
        }
        if ($cursor) {
            $decoded = Pagination::decodeCursor($cursor);
            if ($decoded) {
                $where[] = '(d.created_at, d.id) < (? , ?)';
                [$createdAt, $id] = explode('|', $decoded);
                $params[] = $createdAt;
                $params[] = (int)$id;
            }
        }
        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
        // Join product to filter/search
        $sql = "SELECT d.*, p.name as product_name, p.price as product_price FROM discount d LEFT JOIN product p ON p.id = d.product_id $join $whereSql ORDER BY d.id DESC LIMIT ".$limit;
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        $nextCursor = null;
        if (count($rows) === $limit) {
            $last = end($rows);
            $lastCreated = $last['updated_at'] ?? ($last['created_at'] ?? date('Y-m-d H:i:s'));
            $nextCursor = Pagination::encodeCursor($lastCreated . '|' . (string)$last['id']);
        }
        return ['items' => $rows, 'nextCursor' => $nextCursor];
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT d.*, p.name as product_name, p.price as product_price FROM discount d LEFT JOIN product p ON p.id = d.product_id WHERE d.id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function searchByName(string $q, int $limit = 10): array
    {
        $qLike = '%' . $q . '%';
        $sql = 'SELECT d.*, p.name as product_name, p.price as product_price
                FROM discount d LEFT JOIN product p ON p.id = d.product_id
                WHERE (p.name LIKE ?) AND (d.status = "active") AND (d.start_date IS NULL OR d.start_date <= CURDATE()) AND (d.end_date IS NULL OR d.end_date >= CURDATE())
                ORDER BY d.id DESC LIMIT ' . $limit;
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$qLike]);
        return $stmt->fetchAll() ?: [];
    }
}


