<?php
declare(strict_types=1);

namespace App\Utils;

final class RateLimiter
{
    public function __construct(private string $storageDir)
    {
        if (!is_dir($this->storageDir)) {
            mkdir($this->storageDir, 0777, true);
        }
    }

    public function tooManyAttempts(string $key, int $maxAttempts, int $decaySeconds): bool
    {
        $file = $this->storageDir . DIRECTORY_SEPARATOR . md5($key) . '.rl';
        $now = time();
        $data = ['count' => 0, 'reset' => $now + $decaySeconds];
        if (is_file($file)) {
            $data = json_decode((string)file_get_contents($file), true) ?: $data;
            if ($now > ($data['reset'] ?? 0)) {
                $data = ['count' => 0, 'reset' => $now + $decaySeconds];
            }
        }
        if ($data['count'] >= $maxAttempts) {
            return true;
        }
        $data['count']++;
        file_put_contents($file, json_encode($data));
        return false;
    }
}


