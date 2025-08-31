<?php

namespace App\Models;

use Config\Db;
use PDO;

class AnalyticsModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Db::getInstance();
    }

    /**
     * Track an action for a discount with optional user/device/location demographics.
     * Required: discount_id, action
     * Optional: user_id, device_type, city, region, age_group, gender
     *
     * @param array $data
     */
    public function trackAction(array $data): void
    {
        $stmt = $this->db->prepare('INSERT INTO discount_actions (discount_id, action, created_at, user_id, device_type, city, region, age_group, gender) VALUES (:discount_id, :action, NOW(), :user_id, :device_type, :city, :region, :age_group, :gender)');
        $stmt->bindParam(':discount_id', $data['discount_id']);
        $stmt->bindParam(':action', $data['action']);
        $stmt->bindParam(':user_id', $data['user_id']);
        $stmt->bindParam(':device_type', $data['device_type']);
        $stmt->bindParam(':city', $data['city']);
        $stmt->bindParam(':region', $data['region']);
        $stmt->bindParam(':age_group', $data['age_group']);
        $stmt->bindParam(':gender', $data['gender']);
        $stmt->execute();
        $stmt->closeCursor();
    }

    /**
     * Aggregate action counts for a discount with optional filters.
     * Filters: from, to, device_type, city, region, age_group, gender
     *
     * @param int $discountId
     * @param array $filters
     * @return array
     */
    public function summaryByDiscount(int $discountId, array $filters = []): array
    {
        $conditions = ['discount_id = :id'];
        $params = [':id' => $discountId];
        $this->appendFilters($conditions, $params, $filters);

        $sql = 'SELECT action, COUNT(*) as total FROM discount_actions';
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' GROUP BY action';

        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        // Compute CTR = clicked / view if both present
        $map = [];
        foreach ($rows as $r) {
            $map[$r['action']] = (int)$r['total'];
        }
        $ctr = null;
        if (isset($map['view']) && $map['view'] > 0 && isset($map['clicked'])) {
            $ctr = round($map['clicked'] / $map['view'], 4);
        }
        return [
            'by_action' => $rows,
            'ctr' => $ctr,
        ];
    }

    /**
     * Breakdown of actions by demographic/device/location groups.
     *
     * @param int $discountId
     * @param array $filters
     * @return array
     */
    public function demographics(int $discountId, array $filters = []): array
    {
        $results = [];
        $results['age'] = $this->grouped($discountId, 'age_group', $filters);
        $results['gender'] = $this->grouped($discountId, 'gender', $filters);
        $results['city'] = $this->grouped($discountId, 'city', $filters);
        $results['region'] = $this->grouped($discountId, 'region', $filters);
        $results['device'] = $this->grouped($discountId, 'device_type', $filters);
        return $results;
    }

    /**
     * Helper for grouped aggregations by a single column.
     *
     * @param int $discountId
     * @param string $column
     * @param array $filters
     * @return array
     */
    private function grouped(int $discountId, string $column, array $filters = []): array
    {
        $conditions = ['discount_id = :id'];
        $params = [':id' => $discountId];
        $this->appendFilters($conditions, $params, $filters);

        $sql = "SELECT $column as k, COUNT(*) as total FROM discount_actions";
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= " GROUP BY $column";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    /**
     * Top discounts by count of a specific action.
     * Accepts same filters as others, plus optional company_id.
     *
     * @param string $action
     * @param int $limit
     * @param array $filters
     * @return array
     */
    public function topDiscountsByAction(string $action, int $limit = 10, array $filters = []): array
    {
        $conditions = ['a.action = :action'];
        $params = [':action' => $action];
        $joinDiscount = false;

        // allow filters on action properties
        $this->appendFilters($conditions, $params, $filters, 'a');
        // allow filtering by company via joining discount
        if (isset($filters['company_id'])) {
            $joinDiscount = true;
            $conditions[] = 'd.company_id = :company_id';
            $params[':company_id'] = (int)$filters['company_id'];
        }

        $sql = 'SELECT a.discount_id, COUNT(*) as total FROM discount_actions a';
        if ($joinDiscount) {
            $sql .= ' INNER JOIN discount d ON d.id = a.discount_id';
        }
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' GROUP BY a.discount_id ORDER BY total DESC LIMIT :lim';

        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    /**
     * Time series of actions for a discount.
     * Granularity: day|week|month.
     *
     * @param int $discountId
     * @param array $filters
     * @param string $granularity
     * @return array
     */
    public function timeSeries(int $discountId, array $filters = [], string $granularity = 'day'): array
    {
        $bucketExpr = 'DATE(created_at)';
        if ($granularity === 'week') {
            $bucketExpr = 'DATE_FORMAT(created_at, "%x-%v")';
        } elseif ($granularity === 'month') {
            $bucketExpr = 'DATE_FORMAT(created_at, "%Y-%m")';
        }

        $conditions = ['discount_id = :id'];
        $params = [':id' => $discountId];
        $this->appendFilters($conditions, $params, $filters);

        $sql = "SELECT $bucketExpr as d, COUNT(*) as total FROM discount_actions";
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= " GROUP BY d ORDER BY d";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    /**
     * Appends common filters to a conditions array and parameters map.
     * Supported keys: from (Y-m-d), to (Y-m-d), device_type, city, region, age_group, gender
     * Optionally specify table alias for action fields.
     */
    /**
     * Append common filters to SQL conditions and params.
     * Supported: from, to, device_type, city, region, age_group, gender
     *
     * @param array $conditions
     * @param array $params
     * @param array $filters
     * @param string $alias
     * @return void
     */
    private function appendFilters(array &$conditions, array &$params, array $filters, string $alias = ''): void
    {
        $prefix = $alias ? $alias . '.' : '';
        if (!empty($filters['from'])) {
            $conditions[] = $prefix . 'created_at >= :from';
            $params[':from'] = $filters['from'];
        }
        if (!empty($filters['to'])) {
            $conditions[] = $prefix . 'created_at <= :to';
            $params[':to'] = $filters['to'];
        }
        foreach (['device_type','city','region','age_group','gender'] as $k) {
            if (isset($filters[$k])) {
                $conditions[] = $prefix . $k . ' = :' . $k;
                $params[':' . $k] = $filters[$k];
            }
        }
    }
}


