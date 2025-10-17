<?php

namespace App\Services;

use App\Models\CategoryModel;
use App\Exceptions\ApiException;

class CategoryService
{
    public function __construct(private CategoryModel $categoryModel, private AuthService $authService)
    {
    }

    /**
     * @throws ApiException
     */
    public function list(array $filters): array
    {
        // Listing can be public; do not require auth here for flexibility
        $items = $this->categoryModel->list($filters);
        return ['categories' => $items];
    }

    /**
     * @throws ApiException
     */
    public function upsert(array $data): array
    {
        $this->authService->authorizeRequest();
        if (empty($data['name'])) {
            throw new ApiException(400, 'BAD_REQUEST', 'name is required');
        }
        $id = $this->categoryModel->upsert($data);
        return ['id' => $id];
    }

    /**
     * @throws ApiException
     */
    public function delete(array $data): array
    {
        $this->authService->authorizeRequest();
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) {
            throw new ApiException(400, 'BAD_REQUEST', 'id is required');
        }
        $ok = $this->categoryModel->delete($id);
        return ['deleted' => (bool)$ok];
    }

    /**
     * @throws ApiException
     */
    public function uploadImage(array $data): array
    {
        $this->authService->authorizeRequest();
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) {
            throw new ApiException(400, 'BAD_REQUEST', 'id is required');
        }
        $path = \App\Helpers\UploadHelper::saveBase64($data['file_base64'], __DIR__ . '/../../uploads/categories');
        $this->categoryModel->setImagePath($id, $path);
        return ['path' => $path];
    }

    /**
     * @throws ApiException
     */
    public function setProductCategories(array $data): array
    {
        $this->authService->authorizeRequest();
        $productId = (int)($data['product_id'] ?? 0);
        $categoryIds = $data['category_ids'] ?? [];
        if ($productId <= 0) {
            throw new ApiException(400, 'BAD_REQUEST', 'product_id is required');
        }
        if (!is_array($categoryIds)) {
            throw new ApiException(400, 'BAD_REQUEST', 'category_ids must be an array');
        }
        $this->categoryModel->setProductCategories($productId, $categoryIds);
        return ['ok' => true];
    }

    /**
     * @throws ApiException
     */
    public function listProductCategories(array $data): array
    {
        // could be public
        $productId = (int)($data['product_id'] ?? 0);
        if ($productId <= 0) {
            throw new ApiException(400, 'BAD_REQUEST', 'product_id is required');
        }
        return ['categories' => $this->categoryModel->listByProduct($productId)];
    }
}


