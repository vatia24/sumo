<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\CommentRepository;
use App\Services\GamificationService;
use App\Utils\Request;
use App\Utils\Response;
use App\Utils\Validator;

final class CommentsController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function create(array $params): void
    {
        $userId = (int)($this->req->params['authUserId'] ?? 0);
        $discountId = (int)($params['id'] ?? 0);
        $text = Validator::requiredString($this->req->body, 'text', 1, 1000);
        $rating = Validator::int($this->req->body, 'rating', 1, 5);
        if ($userId <= 0 || $discountId <= 0 || !$text || !$rating) { $this->res->json(['error' => 'Invalid input'], 422); return; }
        $repo = new CommentRepository();
        $id = $repo->add($userId, $discountId, $text, $rating);
        // award points for comment
        (new GamificationService())->performAction($userId, 'comment', $discountId);
        $this->res->json(['id' => $id], 201);
    }

    public function list(array $params): void
    {
        $discountId = (int)($params['id'] ?? 0);
        $limit = isset($this->req->query['limit']) ? max(1, min((int)$this->req->query['limit'], 50)) : 20;
        $cursor = $this->req->query['cursor'] ?? null;
        $repo = new CommentRepository();
        $result = $repo->listByDiscount($discountId, $limit, $cursor);
        $this->res->json($result);
    }
}


