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
     * Time series grouped by action for a discount.
     * Returns array of rows with fields: d (bucket), action, total
     *
     * @param int $discountId
     * @param array $filters
     * @param string $granularity
     * @return array
     */
    public function timeSeriesByAction(int $discountId, array $filters = [], string $granularity = 'day'): array
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

        $sql = "SELECT $bucketExpr as d, action, COUNT(*) as total FROM discount_actions";
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' GROUP BY d, action ORDER BY d';

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
     * Company-wide summary by action.
     */
    public function companySummary(int $companyId, array $filters = []): array
    {
        $conditions = ['d.company_id = :company_id'];
        $params = [':company_id' => $companyId];
        $this->appendFilters($conditions, $params, $filters, 'a');

        $sql = 'SELECT a.action, COUNT(*) as total FROM discount_actions a INNER JOIN discount d ON d.id = a.discount_id';
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' GROUP BY a.action';

        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();

        $map = [];
        foreach ($rows as $r) {
            $map[$r['action']] = (int)$r['total'];
        }
        $views = $map['view'] ?? 0;
        $clicks = $map['clicked'] ?? 0;
        $ctr = $views > 0 ? round($clicks / $views, 4) : null;

        return [
            'by_action' => $rows,
            'ctr' => $ctr,
        ];
    }

    /**
     * Company-wide demographics grouped aggregations.
     */
    public function companyDemographics(int $companyId, array $filters = []): array
    {
        $results = [];
        foreach (['age_group' => 'age', 'gender' => 'gender', 'city' => 'city', 'region' => 'region', 'device_type' => 'device'] as $column => $alias) {
            $conditions = ['d.company_id = :company_id'];
            $params = [':company_id' => $companyId];
            $this->appendFilters($conditions, $params, $filters, 'a');
            $sql = "SELECT $column as k, COUNT(*) as total FROM discount_actions a INNER JOIN discount d ON d.id = a.discount_id";
            if (!empty($conditions)) {
                $sql .= ' WHERE ' . implode(' AND ', $conditions);
            }
            $sql .= " GROUP BY $column";
            $stmt = $this->db->prepare($sql);
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
            }
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmt->closeCursor();
            $results[$alias] = $rows;
        }
        return $results;
    }

    /**
     * Company-wide time series.
     */
    public function companyTimeSeries(int $companyId, array $filters = [], string $granularity = 'day'): array
    {
        $bucketExpr = 'DATE(a.created_at)';
        if ($granularity === 'week') {
            $bucketExpr = 'DATE_FORMAT(a.created_at, "%x-%v")';
        } elseif ($granularity === 'month') {
            $bucketExpr = 'DATE_FORMAT(a.created_at, "%Y-%m")';
        }

        $conditions = ['d.company_id = :company_id'];
        $params = [':company_id' => $companyId];
        $this->appendFilters($conditions, $params, $filters, 'a');

        $sql = "SELECT $bucketExpr as d, COUNT(*) as total FROM discount_actions a INNER JOIN discount d ON d.id = a.discount_id";
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' GROUP BY d ORDER BY d';

        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    /**
     * Company-wide time series by action.
     */
    public function companyTimeSeriesByAction(int $companyId, array $filters = [], string $granularity = 'day'): array
    {
        $bucketExpr = 'DATE(a.created_at)';
        if ($granularity === 'week') {
            $bucketExpr = 'DATE_FORMAT(a.created_at, "%x-%v")';
        } elseif ($granularity === 'month') {
            $bucketExpr = 'DATE_FORMAT(a.created_at, "%Y-%m")';
        }

        $conditions = ['d.company_id = :company_id'];
        $params = [':company_id' => $companyId];
        $this->appendFilters($conditions, $params, $filters, 'a');

        $sql = "SELECT $bucketExpr as d, a.action, COUNT(*) as total FROM discount_actions a INNER JOIN discount d ON d.id = a.discount_id";
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' GROUP BY d, a.action ORDER BY d';

        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $rows;
    }

    /**
     * Active time distribution: by hour-of-day and day-of-week for a discount.
     * Returns structure: [ 'by_hour' => [{h:int,total:int}], 'by_dow' => [{dow:int,total:int}] ]
     *
     * @param int $discountId
     * @param array $filters
     * @return array
     */
    public function activeTime(int $discountId, array $filters = []): array
    {
        // By hour of day (0-23)
        $conditions = ['discount_id = :id'];
        $params = [':id' => $discountId];
        $this->appendFilters($conditions, $params, $filters);

        $sqlHour = 'SELECT HOUR(created_at) as h, COUNT(*) as total FROM discount_actions';
        if (!empty($conditions)) {
            $sqlHour .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sqlHour .= ' GROUP BY h ORDER BY h';

        $stmtH = $this->db->prepare($sqlHour);
        foreach ($params as $k => $v) {
            $stmtH->bindValue($k, $v);
        }
        $stmtH->execute();
        $byHour = $stmtH->fetchAll(PDO::FETCH_ASSOC);
        $stmtH->closeCursor();

        // By day of week (1=Sunday ... 7=Saturday in MySQL DAYOFWEEK)
        $conditions = ['discount_id = :id'];
        $params = [':id' => $discountId];
        $this->appendFilters($conditions, $params, $filters);

        $sqlDow = 'SELECT DAYOFWEEK(created_at) as dow, COUNT(*) as total FROM discount_actions';
        if (!empty($conditions)) {
            $sqlDow .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sqlDow .= ' GROUP BY dow ORDER BY dow';

        $stmtD = $this->db->prepare($sqlDow);
        foreach ($params as $k => $v) {
            $stmtD->bindValue($k, $v);
        }
        $stmtD->execute();
        $byDow = $stmtD->fetchAll(PDO::FETCH_ASSOC);
        $stmtD->closeCursor();

        // Cast ints
        $byHour = array_map(function ($row) {
            return [
                'h' => isset($row['h']) ? (int)$row['h'] : null,
                'total' => isset($row['total']) ? (int)$row['total'] : 0,
            ];
        }, $byHour ?: []);
        $byDow = array_map(function ($row) {
            return [
                'dow' => isset($row['dow']) ? (int)$row['dow'] : null,
                'total' => isset($row['total']) ? (int)$row['total'] : 0,
            ];
        }, $byDow ?: []);

        return [
            'by_hour' => $byHour,
            'by_dow' => $byDow,
        ];
    }

    /**
     * Company-wide active time distribution: by hour-of-day and day-of-week.
     * Returns structure: [ 'by_hour' => [{h:int,total:int}], 'by_dow' => [{dow:int,total:int}] ]
     *
     * @param int $companyId
     * @param array $filters
     * @return array
     */
    public function companyActiveTime(int $companyId, array $filters = []): array
    {
        // By hour of day (0-23)
        $conditions = ['d.company_id = :company_id'];
        $params = [':company_id' => $companyId];
        $this->appendFilters($conditions, $params, $filters, 'a');

        $sqlHour = 'SELECT HOUR(a.created_at) as h, COUNT(*) as total FROM discount_actions a INNER JOIN discount d ON d.id = a.discount_id';
        if (!empty($conditions)) {
            $sqlHour .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sqlHour .= ' GROUP BY h ORDER BY h';

        $stmtH = $this->db->prepare($sqlHour);
        foreach ($params as $k => $v) {
            $stmtH->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmtH->execute();
        $byHour = $stmtH->fetchAll(PDO::FETCH_ASSOC);
        $stmtH->closeCursor();

        // By day of week (1=Sunday ... 7=Saturday in MySQL DAYOFWEEK)
        $conditions = ['d.company_id = :company_id'];
        $params = [':company_id' => $companyId];
        $this->appendFilters($conditions, $params, $filters, 'a');

        $sqlDow = 'SELECT DAYOFWEEK(a.created_at) as dow, COUNT(*) as total FROM discount_actions a INNER JOIN discount d ON d.id = a.discount_id';
        if (!empty($conditions)) {
            $sqlDow .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sqlDow .= ' GROUP BY dow ORDER BY dow';

        $stmtD = $this->db->prepare($sqlDow);
        foreach ($params as $k => $v) {
            $stmtD->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmtD->execute();
        $byDow = $stmtD->fetchAll(PDO::FETCH_ASSOC);
        $stmtD->closeCursor();

        // Cast ints
        $byHour = array_map(function ($row) {
            return [
                'h' => isset($row['h']) ? (int)$row['h'] : null,
                'total' => isset($row['total']) ? (int)$row['total'] : 0,
            ];
        }, $byHour ?: []);
        $byDow = array_map(function ($row) {
            return [
                'dow' => isset($row['dow']) ? (int)$row['dow'] : null,
                'total' => isset($row['total']) ? (int)$row['total'] : 0,
            ];
        }, $byDow ?: []);

        return [
            'by_hour' => $byHour,
            'by_dow' => $byDow,
        ];
    }

    /**
     * Retention metrics for a discount in the given window.
     * Uses user_id when available; excludes null user_id.
     * Returns: unique_users, returning_users (count with >1 actions), retention_rate (returning/unique) or null.
     *
     * @param int $discountId
     * @param array $filters
     * @return array
     */
    public function retention(int $discountId, array $filters = []): array
    {
        $conditions = ['discount_id = :id', 'user_id IS NOT NULL'];
        $params = [':id' => $discountId];
        $this->appendFilters($conditions, $params, $filters);

        $sql = 'SELECT user_id, COUNT(*) as cnt FROM discount_actions';
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' GROUP BY user_id';

        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();

        $unique = 0;
        $returning = 0;
        foreach ($rows as $r) {
            $unique++;
            if ((int)$r['cnt'] > 1) {
                $returning++;
            }
        }
        $rate = $unique > 0 ? round($returning / $unique, 4) : null;

        return [
            'unique_users' => $unique,
            'returning_users' => $returning,
            'retention_rate' => $rate,
        ];
    }

    /**
     * Company-wide retention metrics within a window.
     * Uses user_id when available; excludes null user_id.
     * Returns: unique_users, returning_users, retention_rate.
     *
     * @param int $companyId
     * @param array $filters
     * @return array
     */
    public function companyRetention(int $companyId, array $filters = []): array
    {
        $conditions = ['d.company_id = :company_id', 'a.user_id IS NOT NULL'];
        $params = [':company_id' => $companyId];
        $this->appendFilters($conditions, $params, $filters, 'a');

        $sql = 'SELECT a.user_id, COUNT(*) as cnt FROM discount_actions a INNER JOIN discount d ON d.id = a.discount_id';
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' GROUP BY a.user_id';

        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt->closeCursor();

        $unique = 0;
        $returning = 0;
        foreach ($rows as $r) {
            $unique++;
            if ((int)$r['cnt'] > 1) {
                $returning++;
            }
        }
        $rate = $unique > 0 ? round($returning / $unique, 4) : null;

        return [
            'unique_users' => $unique,
            'returning_users' => $returning,
            'retention_rate' => $rate,
        ];
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

	/**
	 * Company-wide totals by action with optional filters.
	 * Joins discounts to map actions to the owning company.
	 *
	 * @param int $companyId
	 * @param array $filters
	 * @return array
	 */
	public function companyTotals(int $companyId, array $filters = []): array
	{
		$conditions = ['d.company_id = :company_id'];
		$params = [':company_id' => $companyId];
		// Apply filters on the actions table alias 'a'
		$this->appendFilters($conditions, $params, $filters, 'a');

		$sql = 'SELECT a.action, COUNT(*) as total FROM discount_actions a INNER JOIN discount d ON d.id = a.discount_id';
		if (!empty($conditions)) {
			$sql .= ' WHERE ' . implode(' AND ', $conditions);
		}
		$sql .= ' GROUP BY a.action';

		$stmt = $this->db->prepare($sql);
		foreach ($params as $k => $v) {
			$stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
		}
		$stmt->execute();
		$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
		$stmt->closeCursor();

		$map = [];
		foreach ($rows as $r) {
			$map[$r['action']] = (int)$r['total'];
		}
		$views = $map['view'] ?? 0;
		$clicks = $map['clicked'] ?? 0;
		$ctr = $views > 0 ? round($clicks / $views, 4) : null;

		return [
			'total_views' => $views,
			'total_clicks' => $clicks,
			'total_redirects' => $map['redirect'] ?? 0,
			'total_map_open' => $map['map_open'] ?? 0,
			'total_shares' => $map['share'] ?? 0,
			'total_favorites' => $map['favorite'] ?? 0,
			'ctr' => $ctr,
		];
	}
}


