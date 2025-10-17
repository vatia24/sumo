<?php

namespace App\Services;

use App\Models\AnalyticsModel;
use App\Exceptions\ApiException;

class AnalyticsService
{
    private AnalyticsModel $analyticsModel;
    private AuthService $authService;
    /**
     * Small in-process cache TTL seconds. Use APCu if available; otherwise no-op.
     */
    private int $cacheTtl = 20;

    public function __construct(AnalyticsModel $analyticsModel, AuthService $authService)
    {
        $this->analyticsModel = $analyticsModel;
        $this->authService = $authService;
    }

    /**
     * @throws ApiException
     */
    public function track(array $data): array
    {
        $token = $this->authService->authorizeRequest();
        $allowedActions = ['view','clicked','redirect','map_open','share','favorite','not_interested'];
        if (empty($data['action']) || !in_array($data['action'], $allowedActions, true)) {
            throw new ApiException(400, 'BAD_REQUEST', 'Invalid action');
        }
        $payload = [
            'discount_id' => (int)$data['discount_id'],
            'action' => $data['action'],
            'user_id' => $token->data->id ?? null,
            'device_type' => $data['device_type'] ?? null,
            'city' => $data['city'] ?? null,
            'region' => $data['region'] ?? null,
            'age_group' => $data['age_group'] ?? null,
            'gender' => $data['gender'] ?? null,
        ];
        $this->analyticsModel->trackAction($payload);
        return ['tracked' => true];
    }

    /**
     * @throws ApiException
     */
    public function summary(array $data): array
    {
        $this->authService->authorizeRequest();
        // Micro-cache: cache key depends on route + params
        $cacheKey = $this->buildCacheKey('analytics_summary', $data);
        $cached = $this->cacheGet($cacheKey);
        if ($cached !== null) {
            return $cached;
        }
        // If discount_id missing but company_id provided, aggregate company-wide
        if (empty($data['discount_id']) && !empty($data['company_id'])) {
            $companyId = (int)$data['company_id'];
            $filters = [
                'from' => $data['from'] ?? null,
                'to' => $data['to'] ?? null,
                'device_type' => $data['device_type'] ?? null,
                'city' => $data['city'] ?? null,
                'region' => $data['region'] ?? null,
                'age_group' => $data['age_group'] ?? null,
                'gender' => $data['gender'] ?? null,
            ];
            $resp = [
                'summary' => $this->analyticsModel->companySummary($companyId, $filters),
                'demographics' => $this->analyticsModel->companyDemographics($companyId, $filters),
                'timeseries' => $this->analyticsModel->companyTimeSeries($companyId, $filters, $data['granularity'] ?? 'day'),
                'timeseries_by_action' => $this->analyticsModel->companyTimeSeriesByAction($companyId, $filters, $data['granularity'] ?? 'day'),
                'active_time' => $this->analyticsModel->companyActiveTime($companyId, $filters),
                'retention' => $this->analyticsModel->companyRetention($companyId, $filters),
            ];
            $this->cacheSet($cacheKey, $resp);
            return $resp;
        }
        $id = (int)($data['discount_id'] ?? 0);
        $filters = [
            'from' => $data['from'] ?? null,
            'to' => $data['to'] ?? null,
            'device_type' => $data['device_type'] ?? null,
            'city' => $data['city'] ?? null,
            'region' => $data['region'] ?? null,
            'age_group' => $data['age_group'] ?? null,
            'gender' => $data['gender'] ?? null,
        ];
        $resp = [
            'summary' => $this->analyticsModel->summaryByDiscount($id, $filters),
            'demographics' => $this->analyticsModel->demographics($id, $filters),
            'timeseries' => $this->analyticsModel->timeSeries($id, $filters, $data['granularity'] ?? 'day'),
            'timeseries_by_action' => $this->analyticsModel->timeSeriesByAction($id, $filters, $data['granularity'] ?? 'day'),
            'active_time' => $this->analyticsModel->activeTime($id, $filters),
            'retention' => $this->analyticsModel->retention($id, $filters),
        ];
        $this->cacheSet($cacheKey, $resp);
        return $resp;
    }

    /**
     * @throws ApiException
     */
    public function top(array $data): array
    {
        $this->authService->authorizeRequest();
        $action = $data['action'] ?? 'view';
        $limit = isset($data['limit']) ? (int)$data['limit'] : 10;
        $filters = [
            'from' => $data['from'] ?? null,
            'to' => $data['to'] ?? null,
            'device_type' => $data['device_type'] ?? null,
            'city' => $data['city'] ?? null,
            'region' => $data['region'] ?? null,
            'age_group' => $data['age_group'] ?? null,
            'gender' => $data['gender'] ?? null,
            'company_id' => isset($data['company_id']) ? (int)$data['company_id'] : null,
        ];
        $cacheKey = $this->buildCacheKey('analytics_top', ['action' => $action, 'limit' => $limit] + $filters);
        $cached = $this->cacheGet($cacheKey);
        if ($cached !== null) {
            return $cached;
        }
        $resp = ['top' => $this->analyticsModel->topDiscountsByAction($action, $limit, $filters)];
        $this->cacheSet($cacheKey, $resp);
        return $resp;
    }

	/**
	 * Company-wide totals by action.
	 * @throws ApiException
	 */
	public function companyTotals(array $data): array
	{
		$this->authService->authorizeRequest();
		$companyId = isset($data['company_id']) ? (int)$data['company_id'] : 0;
		if ($companyId <= 0) {
			throw new ApiException(400, 'BAD_REQUEST', 'company_id is required');
		}
		$filters = [
			'from' => $data['from'] ?? null,
			'to' => $data['to'] ?? null,
			'device_type' => $data['device_type'] ?? null,
			'city' => $data['city'] ?? null,
			'region' => $data['region'] ?? null,
			'age_group' => $data['age_group'] ?? null,
			'gender' => $data['gender'] ?? null,
		];
        $cacheKey = $this->buildCacheKey('analytics_company_totals', ['company_id' => $companyId] + $filters);
        $cached = $this->cacheGet($cacheKey);
        if ($cached !== null) {
            return $cached;
        }
        $resp = ['totals' => $this->analyticsModel->companyTotals($companyId, $filters)];
        $this->cacheSet($cacheKey, $resp);
        return $resp;
	}

    /**
     * Build a cache key from a base and parameters.
     */
    private function buildCacheKey(string $base, array $params): string
    {
        // Normalize params: sort keys for stable cache keys
        ksort($params);
        return 'dh_' . $base . '_' . sha1(json_encode($params));
    }

    /**
     * Get value from APCu cache if available.
     */
    private function cacheGet(string $key): mixed
    {
        if (\function_exists('apcu_fetch')) {
            $ok = false;
            /** @var mixed $val */
            $val = \call_user_func_array('apcu_fetch', [$key, &$ok]);
            if ($ok) { return $val; }
        }
        return null;
    }

    /**
     * Set value into APCu cache if available.
     */
    private function cacheSet(string $key, mixed $value): void
    {
        if (\function_exists('apcu_store')) {
            \call_user_func('apcu_store', $key, $value, $this->cacheTtl);
        }
    }
}


