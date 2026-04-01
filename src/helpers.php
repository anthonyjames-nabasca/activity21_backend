<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function jsonResponse($response, $data, int $status = 200)
{
    $response->getBody()->write(json_encode($data));
    return $response
        ->withHeader('Content-Type', 'application/json')
        ->withStatus($status);
}

function generateRandomToken(): string
{
    return bin2hex(random_bytes(32));
}

function appUrl(): string
{
    return $_ENV['APP_URL'] ?? 'http://localhost:8080';
}

function clientUrl(): string
{
    return $_ENV['CLIENT_URL'] ?? 'http://localhost:5173';
}

function jwtSecret(): string
{
    return $_ENV['JWT_SECRET'] ?? 'my_super_secret_key_123';
}

function createJwtToken(array $payload): string
{
    $issuedAt = time();
    $expire = $issuedAt + (60 * 60 * 24);

    $tokenPayload = array_merge($payload, [
        'iat' => $issuedAt,
        'exp' => $expire
    ]);

    return JWT::encode($tokenPayload, jwtSecret(), 'HS256');
}

function decodeJwtToken(string $token)
{
    return JWT::decode($token, new Key(jwtSecret(), 'HS256'));
}

function publicFileUrl($request, ?string $relativePath): ?string
{
    if (!$relativePath) {
        return null;
    }

    if (preg_match('/^https?:\/\//', $relativePath)) {
        return $relativePath;
    }

    $uri = $request->getUri();
    return $uri->getScheme() . '://' . $uri->getHost()
        . ($uri->getPort() ? ':' . $uri->getPort() : '')
        . $relativePath;
}

function ensureUploadFolders(): void
{
    $root = __DIR__ . '/../uploads';
    $profile = $root . '/profile';
    $account = $root . '/account';

    if (!is_dir($root)) mkdir($root, 0777, true);
    if (!is_dir($profile)) mkdir($profile, 0777, true);
    if (!is_dir($account)) mkdir($account, 0777, true);
}

function moveUploadedFile(string $directory, array $uploadedFile): ?string
{
    if (empty($uploadedFile['tmp_name'])) {
        return null;
    }

    $allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!in_array($uploadedFile['type'], $allowed)) {
        throw new Exception('Only JPG, JPEG, PNG, and WEBP files are allowed.');
    }

    if (($uploadedFile['size'] ?? 0) > 5 * 1024 * 1024) {
        throw new Exception('File size must not exceed 5MB.');
    }

    $ext = pathinfo($uploadedFile['name'], PATHINFO_EXTENSION);
    $safeName = preg_replace('/[^a-zA-Z0-9-_]/', '_', pathinfo($uploadedFile['name'], PATHINFO_FILENAME));
    $filename = time() . '-' . $safeName . '.' . $ext;

    $targetPath = $directory . DIRECTORY_SEPARATOR . $filename;

    if (!move_uploaded_file($uploadedFile['tmp_name'], $targetPath)) {
        throw new Exception('Failed to upload file.');
    }

    return $filename;
}

function deleteFileIfExists(?string $relativePath): void
{
    if (!$relativePath) return;

    $clean = ltrim($relativePath, '/');
    $fullPath = __DIR__ . '/../' . $clean;

    if (file_exists($fullPath)) {
        @unlink($fullPath);
    }
}

function getBearerToken($request): ?string
{
    $header = $request->getHeaderLine('Authorization');
    if (!$header || !preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
        return null;
    }
    return trim($matches[1]);
}