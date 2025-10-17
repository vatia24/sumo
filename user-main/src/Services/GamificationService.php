<?php
declare(strict_types=1);

namespace App\Services;

use App\Repositories\UserRepository;
use App\Repositories\ActionRepository;

final class GamificationService
{
    private const ACTION_POINTS = [
        'view-address' => 1,
        'go-to-website' => 1,
        'share' => 2,
        'save-to-favorites' => 3,
        'comment' => 5,
        'visit-store' => 10,
    ];

    public function __construct(
        private UserRepository $users = new UserRepository(),
        private ActionRepository $actions = new ActionRepository(),
    ) {
    }

    public function performAction(int $userId, string $type, int $targetId): array
    {
        $points = self::ACTION_POINTS[$type] ?? 0;
        if ($points > 0) {
            $this->users->addPoints($userId, $points);
            $this->actions->log($userId, $type, $targetId, $points);
        }
        $me = $this->users->findById($userId);
        return [
            'awarded' => $points,
            'totalPoints' => (int)($me['points'] ?? 0),
            'level' => (int)($me['level'] ?? 1),
        ];
    }
}


