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
        $userId = $token->data->id;
        $payload = $data;
        unset($payload['user_id']);

        if (!empty($payload['id'])) {
            // On update, derive company from existing discount and authorize there
            $existing = $this->discountModel->getById((int)$payload['id']);
            if (!$existing) throw new ApiException(404, 'NOT_FOUND', 'Discount not found');
            $role = $this->companyModel->getUserRoleForCompany((int)$userId, (int)$existing['company_id']);
            if (!in_array($role, ['Owner','Manager'], true)) {
                throw new ApiException(403, 'FORBIDDEN', 'Insufficient permissions');
            }
            // Do not allow changing company_id or product_id tenant context silently
            if (isset($payload['company_id'])) unset($payload['company_id']);
        } else {
            // Create: require company_id & product_id and authorize
            if (empty($payload['company_id']) || empty($payload['product_id'])) {
                throw new ApiException(400, 'BAD_REQUEST', 'company_id and product_id are required');
            }
            $role = $this->companyModel->getUserRoleForCompany((int)$userId, (int)$payload['company_id']);
            if (!in_array($role, ['Owner','Manager'], true)) {
                throw new ApiException(403, 'FORBIDDEN', 'Insufficient permissions');
            }
        }

        // New rule: clients should provide percent only; price is computed
        if (array_key_exists('discount_price', $payload)) {
            unset($payload['discount_price']);
        }
        if (empty($payload['id'])) {
            if (!isset($payload['discount_percent'])) {
                throw new ApiException(400, 'BAD_REQUEST', 'Provide discount_percent');
            }
        }
        if (isset($payload['discount_percent'])) {
            $percent = (float)$payload['discount_percent'];
            if ($percent <= 0 || $percent > 100) {
                throw new ApiException(400, 'BAD_REQUEST', 'discount_percent must be between 0 and 100');
            }
        }
        $payload['user_id'] = $userId;
        $id = $this->discountModel->upsert($payload);
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


