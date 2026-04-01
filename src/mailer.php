<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/helpers.php';

function baseEmailTemplate($title, $subtitle, $buttonText, $buttonLink, $footerText)
{
    return '
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>' . htmlspecialchars($title) . '</title>
    </head>
    <body style="margin:0; padding:0; background:#f4f7fb; font-family:Arial, Helvetica, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7fb; padding:40px 0;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg, #2563eb, #1d4ed8); padding:28px 32px; text-align:center;">
                  <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">Account Management System</h1>
                  <p style="margin:8px 0 0; color:#dbeafe; font-size:14px;">Secure account access and verification</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 32px; text-align:center;">
                  <h2 style="margin:0 0 12px; color:#111827; font-size:26px;">' . htmlspecialchars($title) . '</h2>
                  <p style="margin:0 0 28px; color:#4b5563; font-size:16px; line-height:1.6;">
                    ' . htmlspecialchars($subtitle) . '
                  </p>
                  <a href="' . htmlspecialchars($buttonLink) . '" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; padding:14px 28px; border-radius:10px;">
                    ' . htmlspecialchars($buttonText) . '
                  </a>
                  <p style="margin:28px 0 8px; color:#6b7280; font-size:13px;">
                    If the button does not work, copy and paste this link into your browser:
                  </p>
                  <p style="margin:0; word-break:break-all; font-size:13px; color:#2563eb;">
                    ' . htmlspecialchars($buttonLink) . '
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 32px; background:#f9fafb; border-top:1px solid #e5e7eb; text-align:center;">
                  <p style="margin:0; color:#6b7280; font-size:13px;">
                    ' . htmlspecialchars($footerText) . '
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>';
}

function successPageTemplate($title, $message, $buttonText, $buttonLink)
{
    return '
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>' . htmlspecialchars($title) . '</title></head>
    <body style="margin:0; padding:0; background:#f4f7fb; font-family:Arial, Helvetica, sans-serif;">
      <table width="100%" height="100%" style="min-height:100vh;">
        <tr>
          <td align="center" valign="middle">
            <table style="max-width:560px; width:100%; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg, #16a34a, #15803d); padding:26px 30px; text-align:center;">
                  <h1 style="margin:0; color:#fff;">' . htmlspecialchars($title) . '</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 30px; text-align:center;">
                  <div style="font-size:52px; margin-bottom:14px;">✅</div>
                  <p style="margin:0 0 24px; color:#374151; font-size:16px; line-height:1.7;">' . htmlspecialchars($message) . '</p>
                  <a href="' . htmlspecialchars($buttonLink) . '" style="display:inline-block; background:#2563eb; color:#fff; text-decoration:none; font-size:16px; font-weight:700; padding:14px 28px; border-radius:10px;">' . htmlspecialchars($buttonText) . '</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>';
}

function errorPageTemplate($title, $message, $buttonText, $buttonLink)
{
    return '
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>' . htmlspecialchars($title) . '</title></head>
    <body style="margin:0; padding:0; background:#f4f7fb; font-family:Arial, Helvetica, sans-serif;">
      <table width="100%" height="100%" style="min-height:100vh;">
        <tr>
          <td align="center" valign="middle">
            <table style="max-width:560px; width:100%; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg, #dc2626, #b91c1c); padding:26px 30px; text-align:center;">
                  <h1 style="margin:0; color:#fff;">' . htmlspecialchars($title) . '</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 30px; text-align:center;">
                  <div style="font-size:52px; margin-bottom:14px;">⚠️</div>
                  <p style="margin:0 0 24px; color:#374151; font-size:16px; line-height:1.7;">' . htmlspecialchars($message) . '</p>
                  <a href="' . htmlspecialchars($buttonLink) . '" style="display:inline-block; background:#2563eb; color:#fff; text-decoration:none; font-size:16px; font-weight:700; padding:14px 28px; border-radius:10px;">' . htmlspecialchars($buttonText) . '</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>';
}

function makeMailer()
{
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
    $mail->Port = (int)($_ENV['SMTP_PORT'] ?? 465);
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV['SMTP_USER'] ?? '';
    $mail->Password = $_ENV['SMTP_PASS'] ?? '';
    $mail->SMTPSecure = (($_ENV['SMTP_SECURE'] ?? 'true') === 'true') ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->setFrom($_ENV['MAIL_FROM'] ?? ($_ENV['SMTP_USER'] ?? ''), 'Account Management System');
    $mail->isHTML(true);
    return $mail;
}

function sendVerificationEmail($email, $fullname, $token)
{
    $verifyLink = appUrl() . '/api/verify-email?token=' . urlencode($token);

    $html = baseEmailTemplate(
        'Verify Your Email',
        "Hello {$fullname}, please confirm your email address to activate your account. Click the button below to continue.",
        'Click to Verify',
        $verifyLink,
        'If you did not create an account, you can safely ignore this email.'
    );

    $mail = makeMailer();
    $mail->addAddress($email);
    $mail->Subject = 'Verify Your Email Address';
    $mail->Body = $html;
    $mail->send();
}

function sendResetEmail($email, $fullname, $token)
{
    $resetLink = clientUrl() . '/reset-password?token=' . urlencode($token);

    $html = baseEmailTemplate(
        'Reset Your Password',
        "Hello {$fullname}, we received a request to reset your password. Click the button below to set a new password.",
        'Reset Password',
        $resetLink,
        'This password reset link will expire in 1 hour.'
    );

    $mail = makeMailer();
    $mail->addAddress($email);
    $mail->Subject = 'Reset Your Password';
    $mail->Body = $html;
    $mail->send();
}

function renderVerificationSuccessPage()
{
    return successPageTemplate(
        'Email Verified',
        'Thank you. Your email address has been successfully verified. You may now continue to the login page and access your account.',
        'Go to Login',
        clientUrl() . '/login'
    );
}

function renderVerificationErrorPage()
{
    return errorPageTemplate(
        'Verification Failed',
        'This verification link is invalid, expired, or has already been used. Please try registering again or request a new verification email.',
        'Go to Login',
        clientUrl() . '/login'
    );
}