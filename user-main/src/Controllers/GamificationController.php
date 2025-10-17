<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Utils\Request;
use App\Utils\Response;

final class GamificationController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function spin(): void
    {
        $this->res->json([
            'reward' => 'points',
            'points' => 10,
            'discount' => null,
        ]);
    }
}


