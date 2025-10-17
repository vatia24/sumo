<?php

namespace App\Models;

use Config\Db;
use PDO;

class DiscountModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Db::getInstance();
    }

    /**
     * List discounts with optional filters.
     * Supported filters: id, company_id, product_id, status (string|array), active_only (bool),
     * from_date (Y-m-d), to_date (Y-m-d), limit, offset
     *
     * @param array $filters
     * @return array
     */
    public function list(array $filters = []): array
    {
        $conditions = [];
        $namedParams = [];

        if (isset($filters['id'])) {
            $conditions[] = 'id = :id';
            $namedParams[':id'] = (int)$filters['id'];
        }
        if (isset($filters['company_id'])) {
            $conditions[] = 'company_id = :company_id';
            $namedParams[':company_id'] = (int)$filters['company_id'];
        }
        if (isset($filters['product_id'])) {
            $conditions[] = 'product_id = :product_id';
            $namedParams[':product_id'] = (int)$filters['product_id'];
        }
        $statusIn = null;
        if (isset($filters['status'])) {
            if (is_array($filters['status']) && !empty($filters['status'])) {
                $statusIn = $filters['status'];
                $conditions[] = 'status IN (' . implode(',', array_fill(0, count($statusIn), '?')) . ')';
            } else {
                $conditions[] = 'status = :status';
                $namedParams[':status'] = (string)$filters['status'];
            }
        }
        if (!empty($filters['active_only'])) {
            $conditions[] = '(start_date IS NULL OR start_date <= CURDATE())';
            $conditions[] = '(end_date IS NULL OR end_date >= CURDATE())';
            if (!isset($filters['status'])) {
                $conditions[] = "status = 'active'";
            }
        }
        if (!empty($filters['from_date'])) {
            $conditions[] = '(end_date IS NULL OR end_date >= :from_date)';
            $namedParams[':from_date'] = $filters['from_date'];
        }
        if (!empty($filters['to_date'])) {
            $conditions[] = '(start_date IS NULL OR start_date <= :to_date)';
            $namedParams[':to_date'] = $filters['to_date'];
        }

        $sql = 'SELECT * FROM discount';
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' ORDER BY id DESC';
        $hasLimit = isset($filters['limit']);
        $hasOffset = isset($filters['offset']);
        if ($hasLimit) $sql .= ' LIMIT :limit';
        if ($hasOffset) $sql .= ' OFFSET :offset';

        $stmt = $this->db->prepare($sql);
        foreach ($namedParams as $key => $val) {
            $stmt->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        if ($statusIn) {
            $pos = 1;
            foreach ($statusIn as $st) {
                $stmt->bindValue($pos, (string)$st, PDO::PARAM_STR);
                $pos++;
            }
        }
        if ($hasLimit) {
            $limit = (int)$filters['limit'];
            if ($limit <= 0) $limit = 20;
            if ($limit > 200) $limit = 200;
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        }
        if ($hasOffset) $stmt->bindValue(':offset', (int)$filters['offset'], PDO::PARAM_INT);

        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    /**
     * Insert or update a discount.
     * Required keys: user_id, company_id, product_id, status.
     * One of discount_price or discount_percent may be provided (mutually exclusive).
     * Optional: start_date, end_date.
     *
     * @param array $data
     * @return int Newly inserted id or existing id on update
     */
    public function upsert(array $data): int
    {
        $isUpdate = !empty($data['id']);

        // Compute discount_price (money off) from product.price and discount_percent
        $computedDiscountAmount = null;
        $hasPercent = array_key_exists('discount_percent', $data);
        $targetProductId = $data['product_id'] ?? null;
        if ($isUpdate && !$targetProductId) {
            // If updating and product_id not provided, lookup current product_id
            $stmtFind = $this->db->prepare('SELECT product_id FROM discount WHERE id = :id');
            $stmtFind->bindValue(':id', (int)$data['id'], PDO::PARAM_INT);
            $stmtFind->execute();
            $row = $stmtFind->fetch(PDO::FETCH_ASSOC);
            $stmtFind->closeCursor();
            if ($row) {
                $targetProductId = (int)$row['product_id'];
            }
        }
        if ($hasPercent && $targetProductId) {
            $stmtPrice = $this->db->prepare('SELECT price FROM product WHERE id = :pid');
            $stmtPrice->bindValue(':pid', (int)$targetProductId, PDO::PARAM_INT);
            $stmtPrice->execute();
            $price = $stmtPrice->fetchColumn();
            $stmtPrice->closeCursor();
            if ($price !== false && $price !== null && $price !== '') {
                $computedDiscountAmount = round(((float)$price) * ((float)$data['discount_percent']) / 100, 2);
            }
        }

        if ($isUpdate) {
            // Partial update: only bind and set provided fields
            $allowed = ['user_id','company_id','product_id','discount_percent','start_date','end_date','status'];
            $setParts = [];
            foreach ($allowed as $col) {
                if (array_key_exists($col, $data)) {
                    $setParts[] = "$col = :$col";
                }
            }
            if ($computedDiscountAmount !== null) {
                $setParts[] = 'discount_price = :discount_price';
            }
            if (empty($setParts)) {
                return (int)$data['id'];
            }
            $sql = 'UPDATE discount SET ' . implode(', ', $setParts) . ' WHERE id = :id';
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':id', (int)$data['id'], PDO::PARAM_INT);
        } else {
            $stmt = $this->db->prepare('INSERT INTO discount (user_id, company_id, product_id, discount_price, discount_percent, start_date, end_date, status) VALUES (:user_id, :company_id, :product_id, :discount_price, :discount_percent, :start_date, :end_date, :status)');
        }

        // Bind values depending on insert or update (partial)
        $bindIfPresent = function(string $name) use ($stmt, $data) {
            if (!array_key_exists($name, $data)) return;
            $param = ":$name";
            $value = $data[$name];
            if (in_array($name, ['user_id','company_id','product_id'])) {
                $stmt->bindValue($param, (int)$value, PDO::PARAM_INT);
                return;
            }
            if (in_array($name, ['discount_price','discount_percent'])) {
                if ($value === null || $value === '') {
                    $stmt->bindValue($param, null, PDO::PARAM_NULL);
                } else {
                    $stmt->bindValue($param, $value);
                }
                return;
            }
            if (in_array($name, ['start_date','end_date'])) {
                if (empty($value)) {
                    $stmt->bindValue($param, null, PDO::PARAM_NULL);
                } else {
                    $stmt->bindValue($param, $value);
                }
                return;
            }
            if ($name === 'status') {
                $stmt->bindValue($param, (string)$value);
            }
        };

        foreach (['user_id','company_id','product_id','discount_percent','start_date','end_date','status'] as $field) {
            $bindIfPresent($field);
        }
        // Bind computed discount_price if available, or null on insert
        if ($computedDiscountAmount !== null) {
            $stmt->bindValue(':discount_price', (string)$computedDiscountAmount);
        } elseif (!$isUpdate) {
            $stmt->bindValue(':discount_price', null, PDO::PARAM_NULL);
        }

        $stmt->execute();
        $stmt->closeCursor();
        return $isUpdate ? (int)$data['id'] : (int)$this->db->lastInsertId();
    }

    /**
     * Bulk update status for multiple discounts.
     *
     * @param array $ids
     * @param string $status
     * @return int number of updated rows
     */
    public function bulkSetStatus(array $ids, string $status): int
    {
        if (empty($ids)) return 0;
        $in = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->db->prepare("UPDATE discount SET status = ? WHERE id IN ($in)");
        $params = array_merge([$status], $ids);
        $stmt->execute($params);
        $count = $stmt->rowCount();
        $stmt->closeCursor();
        return $count;
    }

    /**
     * Get discount by id.
     *
     * @param int $id
     * @return array|null
     */
    public function getById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM discount WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $row ?: null;
    }

    /**
     * Delete discount by id.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM discount WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $ok = $stmt->execute();
        $stmt->closeCursor();
        return (bool)$ok;
    }

    /**
     * Set status for a single discount.
     *
     * @param int $id
     * @param string $status
     * @return bool true if changed
     */
    public function setStatus(int $id, string $status): bool
    {
        $stmt = $this->db->prepare('UPDATE discount SET status = :status WHERE id = :id');
        $stmt->bindValue(':status', $status, PDO::PARAM_STR);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $cnt = $stmt->rowCount();
        $stmt->closeCursor();
        return $cnt > 0;
    }

    /**
     * Get the latest active discount for a product (optionally scoped by company).
     * Active window: start_date <= today <= end_date, status = active.
     *
     * @param int $productId
     * @param int|null $companyId
     * @return array|null
     */
    public function getActiveByProduct(int $productId, ?int $companyId = null): ?array
    {
        $sql = 'SELECT * FROM discount WHERE product_id = :pid AND status = "active" AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE())';
        if ($companyId !== null) {
            $sql .= ' AND company_id = :cid';
        }
        $sql .= ' ORDER BY updated_at DESC LIMIT 1';
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':pid', $productId, PDO::PARAM_INT);
        if ($companyId !== null) {
            $stmt->bindValue(':cid', $companyId, PDO::PARAM_INT);
        }
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $row ?: null;
    }
}


