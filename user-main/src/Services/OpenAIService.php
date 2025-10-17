<?php
declare(strict_types=1);

namespace App\Services;

final class OpenAIService
{
    private string $apiKey;
    private string $baseUrl;
    private string $model;

    public function __construct()
    {
        $this->apiKey = (string)($_ENV['OPENAI_API_KEY'] ?? '');
        $this->baseUrl = rtrim((string)($_ENV['OPENAI_BASE_URL'] ?? 'https://api.openai.com/v1'), '/');
        $this->model = (string)($_ENV['OPENAI_MODEL'] ?? 'gpt-5.0');
    }

    public function chat(array $messages, ?array $tools = null, ?int $maxTokens = null, float $temperature = 0.3): array
    {
        if ($this->apiKey === '') {
            return ['error' => 'OpenAI API key not configured'];
        }

        $payload = [
            'model' => $this->model,
            'messages' => $messages,
            'temperature' => $temperature,
        ];
        if ($maxTokens !== null) {
            $payload['max_tokens'] = $maxTokens;
        }
        if ($tools) {
            $payload['tools'] = $tools;
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . '/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey,
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        if ($response === false) {
            $error = curl_error($ch);
            curl_close($ch);
            return ['error' => 'OpenAI request failed: ' . $error];
        }
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $decoded = json_decode((string)$response, true);
        if ($status >= 400) {
            return ['error' => 'OpenAI error', 'status' => $status, 'details' => $decoded];
        }
        return $decoded ?: ['error' => 'Invalid OpenAI response'];
    }
}



