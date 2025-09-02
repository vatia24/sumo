<?php

namespace App\Services;

use App\Models\AnalyticsModel;
use App\Exceptions\ApiException;

class AnalyticsService
{
    private AnalyticsModel $analyticsModel;
    private AuthService $authService;

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
        $allowedActions = ['view','clicked','redirect','map_open','share','favorite'];
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
        $id = (int)$data['discount_id'];
        $filters = [
            'from' => $data['from'] ?? null,
            'to' => $data['to'] ?? null,
            'device_type' => $data['device_type'] ?? null,
            'city' => $data['city'] ?? null,
            'region' => $data['region'] ?? null,
            'age_group' => $data['age_group'] ?? null,
            'gender' => $data['gender'] ?? null,
        ];
        return [
            'summary' => $this->analyticsModel->summaryByDiscount($id, $filters),
            'demographics' => $this->analyticsModel->demographics($id, $filters),
            'timeseries' => $this->analyticsModel->timeSeries($id, $filters, $data['granularity'] ?? 'day'),
        ];
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
        return ['top' => $this->analyticsModel->topDiscountsByAction($action, $limit, $filters)];
    }
}


