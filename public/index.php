<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/db.php';
require_once __DIR__ . '/../src/helpers.php';
require_once __DIR__ . '/../src/middleware.php';
require_once __DIR__ . '/../src/mailer.php';

ensureUploadFolders();

$app = AppFactory::create();
$app->addBodyParsingMiddleware();

$app->add(function (Request $request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
});

$app->options('/{routes:.+}', function (Request $request, Response $response) {
    return $response;
});

$app->get('/', function (Request $request, Response $response) {
    return jsonResponse($response, ['message' => 'Activity 20 API is running.']);
});

$app->post('/api/register', function (Request $request, Response $response) {
    try {
        $pdo = db();
        $data = $request->getParsedBody();

        $username = trim($data['username'] ?? '');
        $fullname = trim($data['fullname'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = trim($data['password'] ?? '');

        if (!$username || !$fullname || !$email || !$password) {
            return jsonResponse($response, [
                'message' => 'username, fullname, email, and password are required.'
            ], 400);
        }

        $stmt = $pdo->prepare('SELECT user_id FROM users WHERE username = ? OR email = ?');
        $stmt->execute([$username, $email]);
        if ($stmt->fetch()) {
            return jsonResponse($response, [
                'message' => 'Username or email already exists.'
            ], 409);
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $verificationToken = generateRandomToken();

        $stmt = $pdo->prepare("
            INSERT INTO users
            (username, fullname, email, password, profile_image, token, is_verified, verification_token, reset_token, reset_token_expires)
            VALUES (?, ?, ?, ?, NULL, '', 0, ?, NULL, NULL)
        ");
        $stmt->execute([$username, $fullname, $email, $hashedPassword, $verificationToken]);

        try {
            sendVerificationEmail($email, $fullname, $verificationToken);
        } catch (Exception $e) {
        }

        return jsonResponse($response, [
            'message' => 'Registration successful. Please check your email to verify your account.'
        ], 201);
    } catch (Exception $e) {
        return jsonResponse($response, [
            'message' => 'Failed to register user.',
            'error' => $e->getMessage()
        ], 500);
    }
});

$app->get('/api/verify-email', function (Request $request, Response $response) {
    try {
        $pdo = db();
        $token = $_GET['token'] ?? '';

        if (!$token) {
            $response->getBody()->write(renderVerificationErrorPage());
            return $response->withHeader('Content-Type', 'text/html')->withStatus(400);
        }

        $stmt = $pdo->prepare('SELECT user_id, is_verified FROM users WHERE verification_token = ? LIMIT 1');
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        if (!$user) {
            $response->getBody()->write(renderVerificationErrorPage());
            return $response->withHeader('Content-Type', 'text/html')->withStatus(400);
        }

        $stmt = $pdo->prepare('UPDATE users SET is_verified = 1, verification_token = NULL WHERE user_id = ?');
        $stmt->execute([$user['user_id']]);

        $response->getBody()->write(renderVerificationSuccessPage());
        return $response->withHeader('Content-Type', 'text/html')->withStatus(200);
    } catch (Exception $e) {
        $response->getBody()->write(renderVerificationErrorPage());
        return $response->withHeader('Content-Type', 'text/html')->withStatus(500);
    }
});

$app->post('/api/login', function (Request $request, Response $response) {
    try {
        $pdo = db();
        $data = $request->getParsedBody();

        $identifier = trim($data['identifier'] ?? $data['username'] ?? $data['email'] ?? '');
        $password = trim($data['password'] ?? '');

        if (!$identifier || !$password) {
            return jsonResponse($response, [
                'message' => 'username/email and password are required.'
            ], 400);
        }

        $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1');
        $stmt->execute([$identifier, $identifier]);
        $user = $stmt->fetch();

        if (!$user) {
            return jsonResponse($response, ['message' => 'Invalid login credentials.'], 401);
        }

        if ((int)$user['is_verified'] !== 1) {
            return jsonResponse($response, [
                'message' => 'Your account is not verified. Please verify your email first.'
            ], 403);
        }

        if (!password_verify($password, $user['password'])) {
            return jsonResponse($response, ['message' => 'Invalid login credentials.'], 401);
        }

        $token = createJwtToken([
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'email' => $user['email']
        ]);

        $stmt = $pdo->prepare('UPDATE users SET token = ? WHERE user_id = ?');
        $stmt->execute([$token, $user['user_id']]);

        return jsonResponse($response, [
            'message' => 'Login successful.',
            'token' => $token,
            'user' => [
                'user_id' => $user['user_id'],
                'username' => $user['username'],
                'fullname' => $user['fullname'],
                'email' => $user['email'],
                'profile_image' => publicFileUrl($request, $user['profile_image'])
            ]
        ]);
    } catch (Exception $e) {
        return jsonResponse($response, [
            'message' => 'Login failed.',
            'error' => $e->getMessage()
        ], 500);
    }
});

$app->post('/api/logout', function (Request $request, Response $response) {
    $wrapped = authMiddleware($request, new class($response) {
        private $response;
        public function __construct($response) { $this->response = $response; }

        public function handle($request) {
            try {
                $pdo = db();
                $user = $request->getAttribute('user');
                $stmt = $pdo->prepare('UPDATE users SET token = ? WHERE user_id = ?');
                $stmt->execute(['', $user['user_id']]);

                return jsonResponse($this->response, ['message' => 'Logout successful.'], 200);
            } catch (Exception $e) {
                return jsonResponse($this->response, [
                    'message' => 'Logout failed.',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    });

    return $wrapped;
});

$app->post('/api/forgot-password', function (Request $request, Response $response) {
    try {
        $pdo = db();
        $data = $request->getParsedBody();
        $email = trim($data['email'] ?? '');

        if (!$email) {
            return jsonResponse($response, ['message' => 'Email is required.'], 400);
        }

        $stmt = $pdo->prepare('SELECT user_id, fullname, email FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user) {
           $resetToken = generateRandomToken();

$stmt = $pdo->prepare("
    UPDATE users
    SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR)
    WHERE user_id = ?
");
$stmt->execute([$resetToken, $user['user_id']]);

            try {
                sendResetEmail($user['email'], $user['fullname'], $resetToken);
            } catch (Exception $e) {
            }
        }

        return jsonResponse($response, [
            'message' => 'If the email exists, a password reset link has been sent.'
        ]);
    } catch (Exception $e) {
        return jsonResponse($response, [
            'message' => 'Forgot password failed.',
            'error' => $e->getMessage()
        ], 500);
    }
});

$app->post('/api/reset-password', function (Request $request, Response $response) {
    try {
        $pdo = db();
        $data = $request->getParsedBody();

        $token = trim($data['token'] ?? '');
        $newPassword = trim($data['newPassword'] ?? '');

        if (!$token || !$newPassword) {
            return jsonResponse($response, [
                'message' => 'token and newPassword are required.'
            ], 400);
        }

        $stmt = $pdo->prepare("
            SELECT user_id
            FROM users
            WHERE reset_token = ? AND reset_token_expires > NOW()
            LIMIT 1
        ");
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        if (!$user) {
            return jsonResponse($response, [
                'message' => 'Reset token is invalid or expired.'
            ], 400);
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);

        $stmt = $pdo->prepare("
            UPDATE users
            SET password = ?, reset_token = NULL, reset_token_expires = NULL, token = ''
            WHERE user_id = ?
        ");
        $stmt->execute([$hashedPassword, $user['user_id']]);

        return jsonResponse($response, [
            'message' => 'Password has been reset successfully.'
        ]);
    } catch (Exception $e) {
        return jsonResponse($response, [
            'message' => 'Reset password failed.',
            'error' => $e->getMessage()
        ], 500);
    }
});

$app->get('/api/profile', function (Request $request, Response $response) {
    $wrapped = authMiddleware($request, new class($response) {
        private $response;
        public function __construct($response) { $this->response = $response; }

        public function handle($request) {
            try {
                $pdo = db();
                $user = $request->getAttribute('user');

                $stmt = $pdo->prepare("
                    SELECT user_id, username, fullname, email, profile_image, is_verified, created_at, updated_at
                    FROM users WHERE user_id = ? LIMIT 1
                ");
                $stmt->execute([$user['user_id']]);
                $profile = $stmt->fetch();

                if (!$profile) {
                    return jsonResponse($this->response, ['message' => 'Profile not found.'], 404);
                }

                $profile['profile_image'] = publicFileUrl($request, $profile['profile_image']);
                return jsonResponse($this->response, $profile);
            } catch (Exception $e) {
                return jsonResponse($this->response, [
                    'message' => 'Failed to fetch profile.',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    });

    return $wrapped;
});

$app->post('/api/profile/update', function (Request $request, Response $response) {
    $wrapped = authMiddleware($request, new class($response) {
        private $response;
        public function __construct($response) { $this->response = $response; }

        public function handle($request) {
            try {
                $pdo = db();
                $user = $request->getAttribute('user');

                $data = $_POST;
                $files = $_FILES;

                $stmt = $pdo->prepare('SELECT * FROM users WHERE user_id = ? LIMIT 1');
                $stmt->execute([$user['user_id']]);
                $currentUser = $stmt->fetch();

                if (!$currentUser) {
                    return jsonResponse($this->response, ['message' => 'User not found.'], 404);
                }

                $username = trim($data['username'] ?? $currentUser['username']);
                $fullname = trim($data['fullname'] ?? $currentUser['fullname']);
                $email = trim($data['email'] ?? $currentUser['email']);

                $stmt = $pdo->prepare('SELECT user_id FROM users WHERE (username = ? OR email = ?) AND user_id <> ?');
                $stmt->execute([$username, $email, $user['user_id']]);
                if ($stmt->fetch()) {
                    return jsonResponse($this->response, [
                        'message' => 'Username or email is already in use.'
                    ], 409);
                }

                $hashedPassword = $currentUser['password'];
                if (!empty($data['password'])) {
                    $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
                }

                $profileImagePath = $currentUser['profile_image'];

                if (!empty($files['profile_image']['tmp_name'])) {
                    $filename = moveUploadedFile(__DIR__ . '/../public/uploads/profile', $files['profile_image']);

                    if (!empty($currentUser['profile_image'])) {
                        deleteFileIfExists($currentUser['profile_image']);
                    }

                    $profileImagePath = '/uploads/profile/' . $filename;
                }

                $stmt = $pdo->prepare("
                    UPDATE users
                    SET username = ?, fullname = ?, email = ?, password = ?, profile_image = ?
                    WHERE user_id = ?
                ");
                $stmt->execute([
                    $username,
                    $fullname,
                    $email,
                    $hashedPassword,
                    $profileImagePath,
                    $user['user_id']
                ]);

                $stmt = $pdo->prepare("
                    SELECT user_id, username, fullname, email, profile_image, is_verified, created_at, updated_at
                    FROM users WHERE user_id = ? LIMIT 1
                ");
                $stmt->execute([$user['user_id']]);
                $updatedUser = $stmt->fetch();

                if ($updatedUser) {
                    $updatedUser['profile_image'] = publicFileUrl($request, $updatedUser['profile_image']);
                }

                return jsonResponse($this->response, [
                    'message' => 'Profile updated successfully.',
                    'user' => $updatedUser
                ]);
            } catch (Exception $e) {
                return jsonResponse($this->response, [
                    'message' => 'Failed to update profile.',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    });

    return $wrapped;
});

$app->post('/api/account', function (Request $request, Response $response) {
    $wrapped = authMiddleware($request, new class($response) {
        private $response;
        public function __construct($response) { $this->response = $response; }

        public function handle($request) {
            try {
                $pdo = db();
                $user = $request->getAttribute('user');

                $data = $_POST;
                $files = $_FILES;

                $site = trim($data['site'] ?? '');
                $accountUsername = trim($data['account_username'] ?? $data['username'] ?? '');
                $accountPassword = trim($data['account_password'] ?? $data['password'] ?? '');

                if (!$site || !$accountUsername || !$accountPassword) {
                    return jsonResponse($this->response, [
                        'message' => 'site, username, and password are required.'
                    ], 400);
                }

                $stmt = $pdo->prepare("
                    SELECT account_id
                    FROM account_items
                    WHERE user_id = ? AND site = ? AND account_username = ?
                    LIMIT 1
                ");
                $stmt->execute([$user['user_id'], $site, $accountUsername]);
                if ($stmt->fetch()) {
                    return jsonResponse($this->response, [
                        'message' => 'This account item already exists for this user.'
                    ], 409);
                }

                $accountImage = null;
                if (!empty($files['account_image']['tmp_name'])) {
                    $filename = moveUploadedFile(__DIR__ . '/../public/uploads/account', $files['account_image']);
                    $accountImage = '/uploads/account/' . $filename;
                }

                $stmt = $pdo->prepare("
                    INSERT INTO account_items
                    (user_id, site, account_username, account_password, account_image)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([$user['user_id'], $site, $accountUsername, $accountPassword, $accountImage]);

                return jsonResponse($this->response, [
                    'message' => 'Account item created successfully.',
                    'account_id' => $pdo->lastInsertId()
                ], 201);
            } catch (Exception $e) {
                return jsonResponse($this->response, [
                    'message' => 'Failed to create account item.',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    });

    return $wrapped;
});

$app->get('/api/account', function (Request $request, Response $response) {
    $wrapped = authMiddleware($request, new class($response) {
        private $response;
        public function __construct($response) { $this->response = $response; }

        public function handle($request) {
            try {
                $pdo = db();
                $user = $request->getAttribute('user');

                $stmt = $pdo->prepare("
                    SELECT account_id, user_id, site, account_username, account_password, account_image, created_at, updated_at
                    FROM account_items
                    WHERE user_id = ?
                    ORDER BY account_id DESC
                ");
                $stmt->execute([$user['user_id']]);
                $rows = $stmt->fetchAll();

                foreach ($rows as &$row) {
                    $row['account_image'] = publicFileUrl($request, $row['account_image']);
                }

                return jsonResponse($this->response, $rows);
            } catch (Exception $e) {
                return jsonResponse($this->response, [
                    'message' => 'Failed to fetch account items.',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    });

    return $wrapped;
});

$app->get('/api/account/{id}', function (Request $request, Response $response, array $args) {
    $wrapped = authMiddleware($request, new class($response, $args) {
        private $response;
        private $args;

        public function __construct($response, $args) {
            $this->response = $response;
            $this->args = $args;
        }

        public function handle($request) {
            try {
                $pdo = db();
                $user = $request->getAttribute('user');
                $id = $this->args['id'];

                $stmt = $pdo->prepare("
                    SELECT account_id, user_id, site, account_username, account_password, account_image, created_at, updated_at
                    FROM account_items
                    WHERE account_id = ? AND user_id = ?
                    LIMIT 1
                ");
                $stmt->execute([$id, $user['user_id']]);
                $item = $stmt->fetch();

                if (!$item) {
                    return jsonResponse($this->response, ['message' => 'Account item not found.'], 404);
                }

                $item['account_image'] = publicFileUrl($request, $item['account_image']);
                return jsonResponse($this->response, $item);
            } catch (Exception $e) {
                return jsonResponse($this->response, [
                    'message' => 'Failed to fetch account item.',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    });

    return $wrapped;
});

$app->post('/api/account/update', function (Request $request, Response $response) {
    $wrapped = authMiddleware($request, new class($response) {
        private $response;
        public function __construct($response) { $this->response = $response; }

        public function handle($request) {
            try {
                $pdo = db();
                $user = $request->getAttribute('user');

                $data = $_POST;
                $files = $_FILES;

                $accountId = $data['account_id'] ?? null;

                if (!$accountId) {
                    return jsonResponse($this->response, ['message' => 'account_id is required.'], 400);
                }

                $stmt = $pdo->prepare('SELECT * FROM account_items WHERE account_id = ? AND user_id = ? LIMIT 1');
                $stmt->execute([$accountId, $user['user_id']]);
                $currentItem = $stmt->fetch();

                if (!$currentItem) {
                    return jsonResponse($this->response, ['message' => 'Account item not found.'], 404);
                }

                $site = trim($data['site'] ?? $currentItem['site']);
                $accountUsername = trim($data['account_username'] ?? $data['username'] ?? $currentItem['account_username']);
                $accountPassword = trim($data['account_password'] ?? $data['password'] ?? $currentItem['account_password']);

                $accountImagePath = $currentItem['account_image'];

                if (!empty($files['account_image']['tmp_name'])) {
                    $filename = moveUploadedFile(__DIR__ . '/../public/uploads/account', $files['account_image']);

                    if (!empty($currentItem['account_image'])) {
                        deleteFileIfExists($currentItem['account_image']);
                    }

                    $accountImagePath = '/uploads/account/' . $filename;
                }

                $stmt = $pdo->prepare("
                    UPDATE account_items
                    SET site = ?, account_username = ?, account_password = ?, account_image = ?
                    WHERE account_id = ? AND user_id = ?
                ");
                $stmt->execute([
                    $site,
                    $accountUsername,
                    $accountPassword,
                    $accountImagePath,
                    $accountId,
                    $user['user_id']
                ]);

                return jsonResponse($this->response, ['message' => 'Account item updated successfully.']);
            } catch (Exception $e) {
                return jsonResponse($this->response, [
                    'message' => 'Failed to update account item.',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    });

    return $wrapped;
});

$app->delete('/api/account', function (Request $request, Response $response) {
    $wrapped = authMiddleware($request, new class($response) {
        private $response;
        public function __construct($response) { $this->response = $response; }

        public function handle($request) {
            try {
                $pdo = db();
                $user = $request->getAttribute('user');

                $data = $request->getParsedBody();
                if (!$data) {
                    parse_str(file_get_contents('php://input'), $data);
                }

                $accountId = $data['account_id'] ?? null;

                if (!$accountId) {
                    return jsonResponse($this->response, ['message' => 'account_id is required.'], 400);
                }

                $stmt = $pdo->prepare('SELECT * FROM account_items WHERE account_id = ? AND user_id = ? LIMIT 1');
                $stmt->execute([$accountId, $user['user_id']]);
                $item = $stmt->fetch();

                if (!$item) {
                    return jsonResponse($this->response, ['message' => 'Account item not found.'], 404);
                }

                if (!empty($item['account_image'])) {
                    deleteFileIfExists($item['account_image']);
                }

                $stmt = $pdo->prepare('DELETE FROM account_items WHERE account_id = ? AND user_id = ?');
                $stmt->execute([$accountId, $user['user_id']]);

                return jsonResponse($this->response, ['message' => 'Account item deleted successfully.']);
            } catch (Exception $e) {
                return jsonResponse($this->response, [
                    'message' => 'Failed to delete account item.',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    });

    return $wrapped;
});

$app->run();