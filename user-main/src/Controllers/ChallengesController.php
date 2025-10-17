<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\ChallengeRepository;
use App\Repositories\BadgeRepository;
use App\Repositories\UserRepository;
use App\Utils\Request;
use App\Utils\Response;

final class ChallengesController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function active(): void
    {
        $items = (new ChallengeRepository())->active();
        $this->res->json(['items' => $items]);
    }

    public function complete(array $params): void
    {
        $userId = (int)($this->req->params['authUserId'] ?? 0);
        $id = (int)($params['id'] ?? 0);
        $repo = new ChallengeRepository();
        $ok = $repo->markCompleted($userId, $id);
        // simple reward: add points and award a generic badge id=1 if exists
        (new UserRepository())->addPoints($userId, 50);
        (new BadgeRepository())->award($userId, 1);
        $this->res->json(['success' => $ok]);
    }
}


