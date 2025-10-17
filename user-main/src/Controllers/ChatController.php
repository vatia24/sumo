<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\OpenAIService;
use App\Services\SiteContextService;
use App\Repositories\ChatRepository;
use App\Repositories\DiscountRepository;
use App\Repositories\AuditRepository;
use App\Utils\ContentFilter;
use App\Utils\Request;
use App\Utils\Response;

final class ChatController
{
    public function __construct(private Request $req, private Response $res)
    {
    }

    public function chat(): void
    {
        $body = $this->req->body;
        $userMessage = isset($body['message']) ? (string)$body['message'] : '';
        $history = isset($body['history']) && is_array($body['history']) ? $body['history'] : [];
        $sessionKey = isset($body['sessionKey']) ? (string)$body['sessionKey'] : '';

        if ($userMessage === '' && !$history) {
            $this->res->json(['error' => 'message or history is required'], 422);
            return;
        }

        $contextService = new SiteContextService();
        $siteContext = $contextService->buildContext();
        $filter = new ContentFilter();

        $messages = [];
        $messages[] = [
            'role' => 'system',
            'content' => trim(
                "You are a helpful AI assistant for a discounts website.\n" .
                "Policies:\n" .
                "- Do NOT reveal confidential, internal, or personally identifiable information.\n" .
                "- If a user asks for private or internal data, refuse briefly and offer public alternatives.\n" .
                "- Never fabricate product data; only use provided context or say you don't know.\n" .
                "- Keep answers concise and actionable, with clear recommendations when relevant.\n\n" .
                "Website Context:\n" . $siteContext
            ),
        ];

        // Append recent chat history (truncate to last 10 messages)
        if ($history) {
            $normalized = [];
            foreach ($history as $h) {
                if (!is_array($h)) { continue; }
                $role = isset($h['role']) ? (string)$h['role'] : '';
                $content = isset($h['content']) ? (string)$h['content'] : '';
                if ($role !== '' && $content !== '') {
                    $normalized[] = ['role' => $role, 'content' => $content];
                }
            }
            $messages = array_merge($messages, array_slice($normalized, -10));
        }

        if ($userMessage !== '') {
            // Simple confidentiality filter: redact obvious sensitive terms before sending to the model
            $redactions = [
                '/(password|api[_-]?key|secret|token)/i' => '[REDACTED]',
                '/(ssn|social security)/i' => '[REDACTED]',
                '/(credit\s*card|card\s*number)/i' => '[REDACTED]',
            ];
            $sanitized = preg_replace(array_keys($redactions), array_values($redactions), $userMessage) ?? $userMessage;
            if ($filter->isBlocked($userMessage) && !$filter->isLikelySafe($userMessage)) {
                // Log and short-circuit with a safe refusal
                (new AuditRepository())->log((int)($this->req->params['authUserId'] ?? 0) ?: null, $sessionKey ?: null, 'blocked_input', ['message' => $userMessage], ['reply' => ''], true);
                $this->res->json(['reply' => 'I can’t help with confidential or sensitive information. Please rephrase your request without private data.']);
                return;
            }
            $messages[] = ['role' => 'user', 'content' => $sanitized];
        }

        // Deeper grounding: if user provided a query term, fetch relevant discounts
        $relevantJson = '';
        $q = trim($userMessage);
        if ($q !== '') {
            $drepo = new DiscountRepository();
            $relevant = $drepo->searchByName($q, 5);
            if ($relevant) {
                $relevantJson = json_encode(array_map(static function ($row) {
                    return [
                        'id' => $row['id'] ?? null,
                        'product_name' => $row['product_name'] ?? null,
                        'product_price' => $row['product_price'] ?? null,
                        'discount_percent' => $row['discount_percent'] ?? null,
                        'end_date' => $row['end_date'] ?? null,
                    ];
                }, $relevant), JSON_UNESCAPED_SLASHES);
                $messages[] = ['role' => 'system', 'content' => "Relevant discounts (JSON):\n" . $relevantJson];
            }
        }

        $openai = new OpenAIService();
        $response = $openai->chat($messages, null, (int)($_ENV['OPENAI_MAX_TOKENS'] ?? 600), (float)($_ENV['OPENAI_TEMPERATURE'] ?? 0.3));
        if (isset($response['error'])) {
            $this->res->json($response, 500);
            return;
        }

        $reply = '';
        if (!empty($response['choices'][0]['message']['content'])) {
            $reply = (string)$response['choices'][0]['message']['content'];
        }

        // Persist session and messages if sessionKey provided (or create one)
        $repo = new ChatRepository();
        $authUserId = (int)($this->req->params['authUserId'] ?? 0) ?: null;
        if ($sessionKey === '') {
            $sessionKey = self::generateUuid();
        }
        $session = $repo->findSessionByKey($sessionKey);
        if (!$session) {
            $sessionId = $repo->createSession($authUserId, $sessionKey, null);
        } else {
            $sessionId = (int)$session['id'];
        }
        if ($userMessage !== '') { $repo->appendMessage($sessionId, 'user', $userMessage); }
        if ($reply !== '') { $repo->appendMessage($sessionId, 'assistant', $reply); }

        // Audit log (non-blocked)
        (new AuditRepository())->log((int)($this->req->params['authUserId'] ?? 0) ?: null, $sessionKey ?: null, 'chat', [
            'message' => $userMessage,
            'relevant' => $relevantJson ? json_decode($relevantJson, true) : [],
        ], [
            'reply' => $reply,
            'model' => $response['model'] ?? null,
        ], false);

        $this->res->json([
            'reply' => $reply,
            'model' => $response['model'] ?? null,
            'usage' => $response['usage'] ?? null,
            'sessionKey' => $sessionKey,
        ]);
    }

    public function createSession(): void
    {
        $repo = new ChatRepository();
        $sessionKey = self::generateUuid();
        $authUserId = (int)($this->req->params['authUserId'] ?? 0) ?: null;
        $id = $repo->createSession($authUserId, $sessionKey, $this->req->body['title'] ?? null);
        $this->res->json(['sessionKey' => $sessionKey, 'id' => $id]);
    }

    public function listSessions(): void
    {
        $repo = new ChatRepository();
        $authUserId = (int)($this->req->params['authUserId'] ?? 0) ?: null;
        $items = $repo->listSessions($authUserId, 50);
        $this->res->json(['sessions' => $items]);
    }

    public function getMessages(array $params): void
    {
        $sessionKey = (string)($params['sessionKey'] ?? '');
        if ($sessionKey === '') { $this->res->json(['error' => 'sessionKey required'], 422); return; }
        $repo = new ChatRepository();
        $session = $repo->findSessionByKey($sessionKey);
        if (!$session) { $this->res->json(['error' => 'Not found'], 404); return; }
        $messages = $repo->listMessages((int)$session['id'], 200);
        $this->res->json(['messages' => $messages]);
    }

    public function deleteSession(array $params): void
    {
        $sessionKey = (string)($params['sessionKey'] ?? '');
        if ($sessionKey === '') { $this->res->json(['error' => 'sessionKey required'], 422); return; }
        $repo = new ChatRepository();
        $authUserId = (int)($this->req->params['authUserId'] ?? 0) ?: null;
        $ok = $repo->deleteSession($sessionKey, $authUserId);
        $this->res->json(['success' => (bool)$ok]);
    }

    private static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}



