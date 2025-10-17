<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Request;

final class HealthController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function health(): void
    {
        $this->res->json(['status' => 'ok']);
    }
}


