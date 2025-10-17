## DailyHub User API (user-main)

Native PHP (>=8.2) MVC-style API for the PWA discount platform. Uses Composer, PDO (MySQL), JWT auth, and simple middleware.

### Setup
1. Copy `.env.example` to `.env` and adjust DB and JWT values.
2. Install dependencies:
```
composer install
```
3. Run migrations (import SQL):
```
mysql -u root -p dailyhub < migrations/001_init.sql
mysql -u root -p dailyhub < migrations/002_seed.sql
```
4. Start server:
```
php -S localhost:8000 -t public
```

### Priority Endpoints
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- GET `/api/discounts`
- GET `/api/discounts/:id`
- POST `/api/discounts/:id/favorite` (auth)
- DELETE `/api/discounts/:id/favorite` (auth)
- POST `/api/actions/perform` (auth)

### AI Assistant Endpoint
- POST `/api/chat`
  - Body:
    - `message` (string) - latest user message
    - `history` (optional array of `{ role: 'user'|'assistant', content: string }`) - previous messages
    - `sessionKey` (optional string) - if provided, server will persist conversation
  - Response:
    - `reply` (string)
    - `model` (string)
    - `usage` (object)
    - `sessionKey` (string)

The assistant is grounded with website context and a sample of recent products/discounts.

### Chat Sessions (server-side persistence)
- POST `/api/chat/sessions` (auth) → create a session, returns `{ sessionKey, id }`
- GET `/api/chat/sessions` (auth) → list sessions for current user
- GET `/api/chat/sessions/:sessionKey/messages` (auth) → list messages
- DELETE `/api/chat/sessions/:sessionKey` (auth) → delete session

Run migration for chat tables:
```
mysql -u root -p dailyhub < user-main/migrations/003_chat.sql
```

### Environment
Copy `.env.example` to `.env` and set:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default `gpt-5.0`)
- `SITE_NAME`, `SITE_URL`, `SITE_PURPOSE`

See `src/routes.php` for full list.

