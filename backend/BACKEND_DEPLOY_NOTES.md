# Backend deploy notes (for api.harmanbhuju.com.np)

## CORS

The frontend at **https://www.harshitbhuju.com.np** must be allowed by the API.  
`api/cors.php` is included in `api/chat.php` and `api/get_chat_history.php` and sends:

- `Access-Control-Allow-Origin: <request origin>` when the origin is in the allowlist
- `Access-Control-Allow-Credentials: true`
- Handles `OPTIONS` preflight with `200`

If you use **nginx/Apache** in front of PHP, ensure:

1. **No 404 for OPTIONS** – OPTIONS requests to `/rapireport/backend/api/chat.php` and `get_chat_history.php` must reach PHP (so CORS headers are sent). If the server returns 404 for OPTIONS before PHP runs, the browser will show "No 'Access-Control-Allow-Origin' header".
2. **Same path as production** – Frontend calls `https://api.harmanbhuju.com.np/rapireport/backend/api/chat.php`. The document root must serve these files at that path.

## SQL (for chat + admin/doctor/health)

1. Run **schema_admin_doctor_health.sql** (includes `chat_messages` for chat history).
2. Run **schema_admin_only.sql** when you want to assign doctor/admin (the commented `UPDATE` lines).

After that, chat history and roles will work with the app.
