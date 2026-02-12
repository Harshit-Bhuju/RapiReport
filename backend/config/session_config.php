<?php
if (session_status() === PHP_SESSION_NONE) {
    // Detect if connection is secure
    $is_secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;

    // Fallback detection for proxies/tunnels
    if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
        $is_secure = true;
    }

    session_set_cookie_params([
        'lifetime' => 2592000, // 30 days
        'path' => '/',
        'domain' => '',
        'secure' => $is_secure,
        'httponly' => true,
        'samesite' => $is_secure ? 'None' : 'Lax',
    ]);
    session_start();
}
