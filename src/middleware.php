<?php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function authMiddleware($request, $handler)
{
    try {
        $token = getBearerToken($request);

        if (!$token) {
            $response = new Slim\Psr7\Response();
            return jsonResponse($response, ['message' => 'No token provided.'], 401);
        }

        $decoded = decodeJwtToken($token);

        $pdo = db();
        $stmt = $pdo->prepare("
            SELECT user_id, username, fullname, email, profile_image, token, is_verified
            FROM users
            WHERE user_id = ? AND token = ?
            LIMIT 1
        ");
        $stmt->execute([$decoded->user_id, $token]);
        $user = $stmt->fetch();

        if (!$user) {
            $response = new Slim\Psr7\Response();
            return jsonResponse($response, ['message' => 'Invalid token.'], 401);
        }

        if ((int)$user['is_verified'] !== 1) {
            $response = new Slim\Psr7\Response();
            return jsonResponse($response, ['message' => 'Account is not verified.'], 403);
        }

        $request = $request->withAttribute('user', $user);
        $request = $request->withAttribute('token', $token);

        return $handler->handle($request);
    } catch (Exception $e) {
        $response = new Slim\Psr7\Response();
        return jsonResponse($response, ['message' => 'Invalid or expired token.'], 401);
    }
}