<?php

if (!function_exists('dh_env')) {
    function dh_env(string $key, $default = null) {
        $value = $_ENV[$key] ?? getenv($key);
        if ($value === false || $value === null || $value === '') {
            return $default;
        }
        return $value;
    }
}

return [
    'facebook' => [
        'client_id' => dh_env('FACEBOOK_CLIENT_ID', ''),
        'client_secret' => dh_env('FACEBOOK_CLIENT_SECRET', ''),
        'redirect_uri' => dh_env('FACEBOOK_REDIRECT_URI', ''),
    ],
    'google' => [
        'client_id' => dh_env('GOOGLE_CLIENT_ID', ''),
        'client_secret' => dh_env('GOOGLE_CLIENT_SECRET', ''),
        'redirect_uri' => dh_env('GOOGLE_REDIRECT_URI', ''),
    ],
    'jwt_secret_key' => (string) dh_env('JWT_SECRET', 'change-me'),
    'jwt_expiration' => (int) dh_env('JWT_EXPIRATION', 3600),
    'refresh_expiration' => (int) dh_env('REFRESH_EXPIRATION', 1209600), // 14 days default
];