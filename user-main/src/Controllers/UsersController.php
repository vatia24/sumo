<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Repositories\UserRepository;
use App\Repositories\BadgeRepository;
use App\Utils\Request;
use App\Utils\Response;
use App\Utils\Validator;

final class UsersController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function me(): void
    {
        $userId = (int)($this->req->params['authUserId'] ?? 0);
        $repo = new UserRepository();
        $user = $repo->findById($userId);
        $this->res->json(['user' => $user]);
    }

    public function updateMe(): void
    {
        $userId = (int)($this->req->params['authUserId'] ?? 0);
        $name = $this->req->body['name'] ?? null;
        $photo = $this->req->body['photo_url'] ?? null;
        $repo = new UserRepository();
        $ok = $repo->updateProfile($userId, $name, $photo);
        $this->res->json(['success' => $ok]);
    }

    public function achievements(array $params): void
    {
        $userId = (int)($params['id'] ?? 0);
        $badges = (new BadgeRepository())->listByUser($userId);
        $this->res->json(['badges' => $badges]);
    }

    public function updateLocation(): void
    {
        $userId = (int)($this->req->params['authUserId'] ?? 0);
        $lat = $this->req->body['lat'] ?? null;
        $lng = $this->req->body['lng'] ?? null;
        $address = $this->req->body['address'] ?? null;
        $ok = $userId > 0 && $lat !== null && $lng !== null;
        $this->res->json(['success' => (bool)$ok, 'address' => $address]);
    }
}


