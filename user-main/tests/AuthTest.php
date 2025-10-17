<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use App\Services\AuthService;
use App\Repositories\UserRepository;

final class AuthTest extends TestCase
{
    public function testLoginRejectsUnknownUser(): void
    {
        $svc = new AuthService(new UserRepository());
        $this->assertNull($svc->login('unknown@example.com', 'bad'));
    }
}


