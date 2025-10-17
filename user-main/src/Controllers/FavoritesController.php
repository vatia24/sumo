<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\FavoriteRepository;
use App\Utils\Request;
use App\Utils\Response;

final class FavoritesController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function create(array $params): void
    {
        $userId = (int)($this->req->params['authUserId'] ?? 0);
        $discountId = (int)($params['id'] ?? 0);
        if ($userId <= 0 || $discountId <= 0) {
            $this->res->json(['error' => 'Invalid input'], 422);
            return;
        }
        $repo = new FavoriteRepository();
        $ok = $repo->add($userId, $discountId);
        $this->res->json(['success' => $ok]);
    }

    public function delete(array $params): void
    {
        $userId = (int)($this->req->params['authUserId'] ?? 0);
        $discountId = (int)($params['id'] ?? 0);
        if ($userId <= 0 || $discountId <= 0) {
            $this->res->json(['error' => 'Invalid input'], 422);
            return;
        }
        $repo = new FavoriteRepository();
        $ok = $repo->remove($userId, $discountId);
        $this->res->json(['success' => $ok]);
    }

    public function list(): void
    {
        $userId = (int)($this->req->params['authUserId'] ?? 0);
        $limit = isset($this->req->query['limit']) ? max(1, min((int)$this->req->query['limit'], 50)) : 20;
        $cursor = $this->req->query['cursor'] ?? null;
        $repo = new FavoriteRepository();
        $result = $repo->listByUser($userId, $limit, $cursor);
        $this->res->json($result);
    }
}


