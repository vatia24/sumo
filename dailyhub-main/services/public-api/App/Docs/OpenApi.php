<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'Sumo Public API',
    description: 'Customer-facing endpoints for feed, discount details, and company map.'
)]
#[OA\Server(url: '/')]
#[OA\Tag(name: 'Feed', description: 'Customer feed endpoints')]
#[OA\Tag(name: 'Health', description: 'Health check endpoints')]

// Component Schemas
#[OA\Schema(
    schema: 'FeedItem',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 123),
        new OA\Property(property: 'name', type: 'string', example: 'Product A'),
        new OA\Property(property: 'price', type: 'number', format: 'float', example: 49.99),
        new OA\Property(property: 'image', type: 'string', nullable: true, example: '/uploads/products/abc.jpg'),
        new OA\Property(property: 'discount_percent', type: 'number', format: 'float', nullable: true, example: 10),
        new OA\Property(property: 'effective_price', type: 'number', format: 'float', example: 44.99),
    ]
)]
#[OA\Schema(
    schema: 'ProductDetail',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 123),
        new OA\Property(property: 'user_id', type: 'integer', example: 1),
        new OA\Property(property: 'company_id', type: 'integer', example: 1),
        new OA\Property(property: 'branch_id', type: 'integer', nullable: true, example: 2),
        new OA\Property(property: 'name', type: 'string', example: 'Product A'),
        new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Nice product'),
        new OA\Property(property: 'price', type: 'number', format: 'float', example: 49.99),
        new OA\Property(property: 'image', type: 'string', nullable: true, example: '/uploads/products/abc.jpg'),
        new OA\Property(property: 'address', type: 'string', nullable: true),
        new OA\Property(property: 'link', type: 'string', nullable: true),
        new OA\Property(property: 'status', type: 'string', example: 'active'),
        new OA\Property(property: 'created_at', type: 'string', example: '2025-08-21 12:35:36'),
        new OA\Property(property: 'updated_at', type: 'string', example: '2025-08-27 11:46:00'),
        new OA\Property(property: 'discount_percent', type: 'number', format: 'float', nullable: true, example: 10),
        new OA\Property(property: 'effective_price', type: 'number', format: 'float', example: 44.99),
    ]
)]
#[OA\Schema(
    schema: 'CompanyMapItem',
    type: 'object',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 7),
        new OA\Property(property: 'full_name', type: 'string', example: 'Acme LLC'),
        new OA\Property(property: 'latitude', type: 'number', format: 'float', example: 41.7151),
        new OA\Property(property: 'longitude', type: 'number', format: 'float', example: 44.8271),
    ]
)]
class OpenApi
{
}


