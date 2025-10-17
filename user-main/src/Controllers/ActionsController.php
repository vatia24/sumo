<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\ActionRepository;
use App\Services\GamificationService;
use App\Utils\Request;
use App\Utils\Response;
use App\Utils\Validator;

final class ActionsController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function perform(): void
    {
        $userId = (int)($this->req->params['authUserId'] ?? 0);
        $type = Validator::requiredString($this->req->body, 'type', 2, 64);
        $targetId = Validator::int($this->req->body, 'targetId', 1);

        if ($userId <= 0 || !$type || !$targetId) {
            $this->res->json(['error' => 'Invalid input'], 422);
            return;
        }

        // Validate enumerated action types to guard unexpected values
        $allowed = ['view-address','go-to-website','share','save-to-favorites','comment','visit-store'];
        if (!in_array($type, $allowed, true)) {
            $this->res->json(['error' => 'Unsupported action type'], 400);
            return;
        }

        $svc = new GamificationService();
        $result = $svc->performAction($userId, $type, $targetId);
        $this->res->json($result);
    }

    public function history(): void
    {
        $userId = (int)($this->req->params['authUserId'] ?? 0);
        $limit = isset($this->req->query['limit']) ? max(1, min((int)$this->req->query['limit'], 50)) : 20;
        $cursor = $this->req->query['cursor'] ?? null;
        $repo = new ActionRepository();
        $result = $repo->history($userId, $limit, $cursor);
        $this->res->json($result);
    }

    public function badges(): void
    {
        $userId = (int)($this->req->params['authUserId'] ?? 0);
        $items = (new \App\Repositories\BadgeRepository())->listByUser($userId);
        $this->res->json(['items' => $items]);
    }

    public function leaderboard(): void
    {
        $period = $this->req->query['period'] ?? 'weekly';
        $items = (new \App\Repositories\LeaderboardRepository())->top($period === 'monthly' ? 'monthly' : 'weekly');
        $this->res->json(['items' => $items]);
    }
}


