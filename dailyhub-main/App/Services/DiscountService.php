<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\DiscountModel;
use App\Models\CompanyModel;

class DiscountService
{
    private DiscountModel $discountModel;
    private AuthService $authService;
    private CompanyModel $companyModel;

    public function __construct(DiscountModel $discountModel, AuthService $authService, CompanyModel $companyModel)
    {
        $this->discountModel = $discountModel;
        $this->authService = $authService;
        $this->companyModel = $companyModel;
    }

    /**
     * @throws ApiException
     */
    public function list(array $data): array
    {
        $this->authService->authorizeRequest();
        return ['discounts' => $this->discountModel->list($data)];
    }

    /**
     * @throws ApiException
     */
    public function upsert(array $data): array
    {
        $token = $this->authService->authorizeRequest();
        $data['user_id'] = $token->data->id;
        // RBAC: allow only Owner/Manager of the company
        $role = $this->companyModel->getUserRoleForCompany((int)$data['user_id'], (int)$data['company_id']);
        if (!in_array($role, ['Owner','Manager'], true)) {
            throw new ApiException(403, 'FORBIDDEN', 'Insufficient permissions');
        }
        // New rule: clients should provide percent only; price is computed
        if (array_key_exists('discount_price', $data)) {
            unset($data['discount_price']);
        }
        if (empty($data['id'])) {
            if (!isset($data['discount_percent'])) {
                throw new ApiException(400, 'BAD_REQUEST', 'Provide discount_percent');
            }
        }
        if (isset($data['discount_percent'])) {
            $percent = (float)$data['discount_percent'];
            if ($percent <= 0 || $percent > 100) {
                throw new ApiException(400, 'BAD_REQUEST', 'discount_percent must be between 0 and 100');
            }
        }
        $id = $this->discountModel->upsert($data);
        return ['id' => $id];
    }

    /**
     * @throws ApiException
     */
    public function bulkStatus(array $data): array
    {
        $this->authService->authorizeRequest();
        $updated = $this->discountModel->bulkSetStatus($data['ids'] ?? [], $data['status'] ?? 'inactive');
        return ['updated' => $updated];
    }
}


