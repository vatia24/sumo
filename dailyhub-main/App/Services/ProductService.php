<?php

namespace App\Services;

use App\Models\ProductModel;
use App\Models\CompanyModel;
use App\Exceptions\ApiException;

class ProductService
{
    private ProductModel $productModel;
    private AuthService $authService;
    private CompanyModel $companyModel;

    public function __construct(ProductModel $productModel, AuthService $authService, CompanyModel $companyModel)
    {
        $this->productModel = $productModel;
        $this->authService = $authService;
        $this->companyModel = $companyModel;
    }

    /**
     * @throws ApiException
     */
    public function getProducts(array $data): array
    {
        // Ensure the request is authorized
        $this->authService->authorizeRequest();

        if (isset($data['id'])) {
            $product = $this->productModel->getProductWithDiscountById((int)$data['id']);
            return $product ? [$product] : [];
        }

        return $this->productModel->getAllProductsWithDiscounts();
    }

    /**
     * @throws ApiException
     */
    public function list(array $filters): array
    {
        $this->authService->authorizeRequest();
        return ['products' => $this->productModel->listProducts($filters)];
    }

    /**
     * Get a single product by id with its active discount (if any).
     *
     * @throws ApiException
     */
    public function getProduct(array $data): array
    {
        $this->authService->authorizeRequest();
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) {
            throw new ApiException(400, 'BAD_REQUEST', 'id is required');
        }
        $product = $this->productModel->getProductWithDiscountById($id);
        if (!$product) {
            throw new ApiException(404, 'NOT_FOUND', 'Product not found');
        }
        return ['product' => $product];
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

        // Update path: authorize against existing product's company and prevent cross-tenant move
        if (!empty($payload['id'])) {
            $existing = $this->productModel->getById((int)$payload['id']);
            if (!$existing) throw new ApiException(404, 'NOT_FOUND', 'Product not found');
            $role = $this->companyModel->getUserRoleForCompany((int)$userId, (int)$existing['company_id']);
            if (!in_array($role, ['Owner','Manager'], true)) {
                throw new ApiException(403, 'FORBIDDEN', 'Insufficient permissions');
            }
            // Do not allow changing company_id via this endpoint
            if (isset($payload['company_id'])) unset($payload['company_id']);
        } else {
            // Create path: require company_id and authorize
            if (empty($payload['company_id'])) {
                throw new ApiException(400, 'BAD_REQUEST', 'company_id is required');
            }
            $role = $this->companyModel->getUserRoleForCompany((int)$userId, (int)$payload['company_id']);
            if (!in_array($role, ['Owner','Manager'], true)) {
                throw new ApiException(403, 'FORBIDDEN', 'Insufficient permissions');
            }
            $payload['user_id'] = (int)$userId;
        }

        $id = $this->productModel->upsertProduct($payload);
        // Optional: set categories if provided
        if (!empty($data['category_ids']) && is_array($data['category_ids'])) {
            (new \App\Models\CategoryModel())->setProductCategories((int)$id, $data['category_ids']);
        }
        return ['id' => $id];
    }

    /**
     * @throws ApiException
     */
    public function delete(array $data): array
    {
        $token = $this->authService->authorizeRequest();
        $userId = $token->data->id;
        $product = $this->productModel->getById((int)$data['id']);
        if (!$product) throw new ApiException(404, 'NOT_FOUND', 'Product not found');
        $role = $this->companyModel->getUserRoleForCompany((int)$userId, (int)$product['company_id']);
        if (!in_array($role, ['Owner','Manager'], true)) {
            throw new ApiException(403, 'FORBIDDEN', 'Insufficient permissions');
        }
        $ok = $this->productModel->deleteProduct((int)$data['id']);
        return ['deleted' => (bool)$ok];
    }

    /**
     * @throws ApiException
     */
    public function bulkStatus(array $data): array
    {
        $this->authService->authorizeRequest();
        $updated = $this->productModel->bulkSetStatus($data['ids'] ?? [], $data['status'] ?? 'inactive');
        return ['updated' => $updated];
    }

    /**
     * @throws ApiException
     */
    public function addImage(array $data): array
    {
        $this->authService->authorizeRequest();
        $path = \App\Helpers\UploadHelper::saveBase64($data['file_base64'], __DIR__ . '/../../uploads/products');
        $imageId = $this->productModel->addImage((int)$data['product_id'], $path);
        return ['image_id' => $imageId, 'path' => $path];
    }

    /**
     * @throws ApiException
     */
    public function listImages(array $data): array
    {
        $this->authService->authorizeRequest();
        return ['images' => $this->productModel->listImages((int)$data['product_id'])];
    }

    /**
     * @throws ApiException
     */
    public function deleteImage(array $data): array
    {
        $this->authService->authorizeRequest();
        $this->productModel->deleteImage((int)$data['image_id']);
        return ['deleted' => true];
    }
}