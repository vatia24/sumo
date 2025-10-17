<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Utils\Request;
use App\Utils\Response;

final class SearchController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function index(): void
    {
        $q = trim((string)($this->req->query['q'] ?? ''));
        $type = $this->req->query['type'] ?? 'all';
        $limit = isset($this->req->query['limit']) ? max(1, min((int)$this->req->query['limit'], 50)) : 20;
        $cursor = $this->req->query['cursor'] ?? null;

        $discounts = [];
        $stores = [];

        // Search discounts via DiscountRepository by product name when q provided
        $discountFilters = [];
        if ($q !== '') {
            // naive LIKE filter: product name contains q (implemented in repository SQL via join)
            // For now, piggyback by not filtering here; fetch latest and filter in PHP
        }
        $drepo = new \App\Repositories\DiscountRepository();
        $dres = $drepo->list($discountFilters, $limit, $cursor);
        $discounts = $q !== '' ? array_values(array_filter($dres['items'], function ($row) use ($q) {
            $name = (string)($row['product_name'] ?? '');
            return stripos($name, $q) !== false;
        })) : $dres['items'];

        // Search stores via StoreRepository
        $srepo = new \App\Repositories\StoreRepository();
        $sres = $srepo->list(['q' => $q], $limit, $cursor);
        $stores = $sres['items'];

        $this->res->json([
            'query' => ['q' => $q, 'type' => $type],
            'results' => [
                'discounts' => ($type === 'stores') ? [] : $discounts,
                'stores' => ($type === 'discounts') ? [] : $stores,
            ],
            'nextCursor' => null,
        ]);
    }
}


