<?php
declare(strict_types=1);

namespace App\Utils;

final class ContentFilter
{
    /** @var array<int, string> */
    private array $blocklist;
    /** @var array<int, string> */
    private array $allowlist;

    public function __construct()
    {
        $this->blocklist = array_filter(array_map('trim', explode('|', (string)($_ENV['AI_BLOCKLIST_REGEX'] ?? 'password|api[_-]?key|secret|token|ssn|credit\s*card'))));
        $this->allowlist = array_filter(array_map('trim', explode('|', (string)($_ENV['AI_ALLOWLIST_REGEX'] ?? 'discount|deal|product|store|price'))));
    }

    public function isBlocked(string $text): bool
    {
        foreach ($this->blocklist as $pattern) {
            if ($pattern === '') { continue; }
            if (@preg_match('/' . $pattern . '/i', $text)) {
                if (preg_match('/' . $pattern . '/i', $text)) { return true; }
            }
        }
        return false;
    }

    public function isLikelySafe(string $text): bool
    {
        foreach ($this->allowlist as $pattern) {
            if ($pattern === '') { continue; }
            if (@preg_match('/' . $pattern . '/i', $text)) {
                if (preg_match('/' . $pattern . '/i', $text)) { return true; }
            }
        }
        return false;
    }

    public function redact(string $text): string
    {
        $patterns = array_map(static fn($p) => '/' . $p . '/i', $this->blocklist);
        return $patterns ? preg_replace($patterns, '[REDACTED]', $text) ?? $text : $text;
    }
}


