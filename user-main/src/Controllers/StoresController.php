<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\StoreRepository;
use App\Utils\Request;
use App\Utils\Response;

final class StoresController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function index(): void
    {
        $filters = [
            'lat' => $this->req->query['lat'] ?? null,
            'lng' => $this->req->query['lng'] ?? null,
            'radius' => $this->req->query['radius'] ?? null,
            'category' => $this->req->query['category'] ?? null,
            'q' => $this->req->query['q'] ?? null,
        ];
        $limit = isset($this->req->query['limit']) ? max(1, min((int)$this->req->query['limit'], 50)) : 20;
        $cursor = $this->req->query['cursor'] ?? null;
        $repo = new StoreRepository();
        $result = $repo->list($filters, $limit, $cursor);
        $this->res->json($result);
    }

    public function show(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        $repo = new StoreRepository();
        $item = $repo->find($id);
        if (!$item) { $this->res->json(['error' => 'Not found'], 404); return; }
        $this->res->json($item);
    }
}


