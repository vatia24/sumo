<?php

namespace App\Controllers;

use App\Models\FeedModel;
use OpenApi\Attributes as OA;

class FeedController
{
    private FeedModel $model;

    public function __construct(FeedModel $model)
    {
        $this->model = $model;
    }

    #[OA\Get(
        path: '/v1/feed',
        tags: ['Feed'],
        summary: 'List feed items',
        parameters: [
            new OA\Parameter(name: 'limit', in: 'query', required: false, schema: new OA\Schema(type: 'integer', minimum: 1, default: 20)),
            new OA\Parameter(name: 'offset', in: 'query', required: false, schema: new OA\Schema(type: 'integer', minimum: 0, default: 0)),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Successful response',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'items',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/FeedItem')
                        ),
                    ]
                )
            )
        ]
    )]
    public function list(array $query): void
    {
        header('Content-Type: application/json');
        echo json_encode([
            'items' => $this->model->feed($query)
        ]);
    }

    #[OA\Get(
        path: '/v1/discount',
        tags: ['Feed'],
        summary: 'Get discount/product detail by id',
        parameters: [
            new OA\Parameter(name: 'id', in: 'query', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Successful response',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'item', ref: '#/components/schemas/ProductDetail', nullable: true),
                    ]
                )
            )
        ]
    )]
    public function detail(array $query): void
    {
        header('Content-Type: application/json');
        $id = (int)($query['id'] ?? 0);
        echo json_encode([
            'item' => $id ? $this->model->detail($id) : null
        ]);
    }

    #[OA\Get(
        path: '/v1/map',
        tags: ['Feed'],
        summary: 'Get companies with coordinates',
        responses: [
            new OA\Response(
                response: 200,
                description: 'Successful response',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'items',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/CompanyMapItem')
                        ),
                    ]
                )
            )
        ]
    )]
    public function map(array $query): void
    {
        header('Content-Type: application/json');
        echo json_encode([
            'items' => $this->model->map($query)
        ]);
    }
}

