<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Utils\Request;
use App\Utils\Response;
use App\Repositories\CategoryRepository;

final class CategoriesController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function index(): void
    {
        $filters = [
            'parent_id' => $this->req->query['parent_id'] ?? null,
            'q' => $this->req->query['q'] ?? null,
            'limit' => isset($this->req->query['limit']) ? (int)$this->req->query['limit'] : 100,
            'offset' => isset($this->req->query['offset']) ? (int)$this->req->query['offset'] : 0,
        ];
        $repo = new CategoryRepository();
        $items = $repo->list($filters);
        $this->res->json(['items' => $items]);
    }

    public function tree(): void
    {
        $repo = new CategoryRepository();
        $rows = $repo->all();
        $byParent = [];
        foreach ($rows as $row) {
            $pid = $row['parent_id'] ?? null;
            $byParent[$pid][] = $row;
        }
        $roots = $byParent[null] ?? [];
        foreach ($roots as &$root) {
            $root['children'] = $byParent[$root['id']] ?? [];
        }
        $this->res->json(['items' => $roots]);
    }

    public function roots(): void
    {
        $repo = new CategoryRepository();
        $items = $repo->list(['parent_id' => null, 'limit' => 1000, 'offset' => 0]);
        $this->res->json(['items' => $items]);
    }
}


