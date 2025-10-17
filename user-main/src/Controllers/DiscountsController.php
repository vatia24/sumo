<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\DiscountRepository;
use App\Utils\Request;
use App\Utils\Response;

final class DiscountsController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function index(): void
    {
        $filters = [
            'category' => $this->req->query['category'] ?? null,
            'minDiscount' => isset($this->req->query['minDiscount']) ? (int)$this->req->query['minDiscount'] : null,
            'maxDiscount' => isset($this->req->query['maxDiscount']) ? (int)$this->req->query['maxDiscount'] : null,
            'minPrice' => isset($this->req->query['minPrice']) ? (float)$this->req->query['minPrice'] : null,
            'maxPrice' => isset($this->req->query['maxPrice']) ? (float)$this->req->query['maxPrice'] : null,
            'expiresSoon' => isset($this->req->query['expiresSoon']) ? filter_var($this->req->query['expiresSoon'], FILTER_VALIDATE_BOOLEAN) : null,
            'isUrgent' => isset($this->req->query['isUrgent']) ? filter_var($this->req->query['isUrgent'], FILTER_VALIDATE_BOOLEAN) : null,
            'lat' => $this->req->query['lat'] ?? null,
            'lng' => $this->req->query['lng'] ?? null,
            'radius' => $this->req->query['radius'] ?? null,
        ];
        $limit = isset($this->req->query['limit']) ? max(1, min((int)$this->req->query['limit'], 50)) : 20;
        $cursor = $this->req->query['cursor'] ?? null;
        $repo = new DiscountRepository();
        $result = $repo->list($filters, $limit, $cursor);
        $this->res->json($result);
    }

    public function show(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        if ($id <= 0) {
            $this->res->json(['error' => 'Invalid id'], 422);
            return;
        }
        $repo = new DiscountRepository();
        $item = $repo->find($id);
        if (!$item) {
            $this->res->json(['error' => 'Not found'], 404);
            return;
        }
        $this->res->json($item);
    }

    public function view(array $params): void
    {
        $id = (int)($params['id'] ?? 0);
        if ($id <= 0) { $this->res->json(['error' => 'Invalid id'], 422); return; }
        $this->res->json(['success' => true]);
    }
}


