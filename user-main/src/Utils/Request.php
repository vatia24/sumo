<?php
declare(strict_types=1);

namespace App\Utils;

final class Request
{
    public array $query;
    public array $headers;
    public array $server;
    public array $cookies;
    public array $files;
    public array $body;
    public array $params = [];

    public function __construct()
    {
        $this->query = $_GET ?? [];
        $this->headers = function_exists('getallheaders') ? (getallheaders() ?: []) : [];
        $this->server = $_SERVER ?? [];
        $this->cookies = $_COOKIE ?? [];
        $this->files = $_FILES ?? [];
        $input = file_get_contents('php://input') ?: '';
        $json = json_decode($input, true);
        $this->body = is_array($json) ? $json : [];
    }

    public function bearerToken(): ?string
    {
        $auth = $this->headers['Authorization'] ?? $this->headers['authorization'] ?? null;
        if (!$auth || stripos($auth, 'Bearer ') !== 0) {
            return null;
        }
        return substr($auth, 7);
    }
}


