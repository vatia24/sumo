<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Utils\Request;
use App\Utils\Response;

final class NotificationsController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function index(): void
    {
        $limit = isset($this->req->query['limit']) ? max(1, min((int)$this->req->query['limit'], 50)) : 20;
        $cursor = $this->req->query['cursor'] ?? null;
        $this->res->json([
            'items' => [],
            'nextCursor' => null,
            'limit' => $limit,
            'cursor' => $cursor,
        ]);
    }
}


