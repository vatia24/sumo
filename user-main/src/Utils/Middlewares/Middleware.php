<?php
declare(strict_types=1);

namespace App\Utils\Middlewares;

use App\Utils\Request;
use App\Utils\Response;
use App\Utils\RateLimiter;

interface Middleware
{
    public function __construct(Request $request, Response $response, RateLimiter $rateLimiter);
    public function handle(): bool; // true to continue, false if response sent
}


