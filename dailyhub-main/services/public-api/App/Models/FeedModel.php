<?php

namespace App\Models;

use Config\Db;
use PDO;

class FeedModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Db::getInstance();
    }

    public function feed(array $q): array
    {
        $limit = isset($q['limit']) ? max(1, (int)$q['limit']) : 20;
        $offset = isset($q['offset']) ? max(0, (int)$q['offset']) : 0;
        $stmt = $this->db->prepare(
            'SELECT p.id, p.name, p.price, COALESCE(img.path, p.image_url) AS image,
                    d.discount_percent,
                    CASE WHEN d.discount_percent IS NOT NULL THEN ROUND(p.price * (1 - d.discount_percent/100), 2) ELSE p.price END AS effective_price
             FROM product p
             LEFT JOIN (
               SELECT product_id, path FROM product_images pi
               INNER JOIN (SELECT product_id, MAX(id) AS max_id FROM product_images GROUP BY product_id) last
               ON pi.product_id = last.product_id AND pi.id = last.max_id
             ) img ON img.product_id = p.id
             LEFT JOIN discount d ON d.product_id = p.id AND d.status IN ("active","scheduled")
               AND (d.start_date IS NULL OR d.start_date <= CURDATE())
               AND (d.end_date IS NULL OR d.end_date >= CURDATE())
             ORDER BY p.updated_at DESC LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function detail(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT p.*, COALESCE(img.path, p.image_url) AS image,
                    d.discount_percent,
                    CASE WHEN d.discount_percent IS NOT NULL THEN ROUND(p.price * (1 - d.discount_percent/100), 2) ELSE p.price END AS effective_price
             FROM product p
             LEFT JOIN (
               SELECT product_id, path FROM product_images pi
               INNER JOIN (SELECT product_id, MAX(id) AS max_id FROM product_images GROUP BY product_id) last
               ON pi.product_id = last.product_id AND pi.id = last.max_id
             ) img ON img.product_id = p.id
             LEFT JOIN discount d ON d.product_id = p.id AND d.status IN ("active","scheduled")
               AND (d.start_date IS NULL OR d.start_date <= CURDATE())
               AND (d.end_date IS NULL OR d.end_date >= CURDATE())
             WHERE p.id = :id'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function map(array $q): array
    {
        $stmt = $this->db->prepare(
            'SELECT c.id, c.full_name, c.latitude, c.longitude
             FROM companies c WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL'
        );
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

