<?php


use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/php_mailer/Exception.php';
require __DIR__ . '/php_mailer/PHPMailer.php';
require __DIR__ . '/php_mailer/SMTP.php';


function sendResponseAndContinue($data)
{
    // If fastcgi_finish_request is available, it's the cleanest way
    if (function_exists('fastcgi_finish_request')) {
        echo json_encode($data);
        session_write_close(); // Important to release session lock
        fastcgi_finish_request();
        return;
    }

    // Fallback for non-FastCGI environments
    $response = json_encode($data);

    ignore_user_abort(true);
    set_time_limit(0);

    ob_start();
    echo $response;
    $size = ob_get_length();
    header("Content-Length: $size");
    header("Connection: close");
    header("Content-Type: application/json");
    ob_end_flush();
    flush();

    if (session_id()) session_write_close();
}

function sendEmail($email, $subject, $custom_template)
{
    try {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username = getenv('SMTP_USER');
        $mail->Password = getenv('SMTP_PASS');
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 465;

        $mail->setFrom('rapireport0701@gmail.com', 'RapiReport');
        $mail->addAddress($email);

        $mail->isHTML(true);
        $mail->Subject = $subject;

        $mail->Body = $custom_template;
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Email Error: {$mail->ErrorInfo}");
        return false;
    }
}

function sendOTPEmail($email, $otp, $type = 'signup')
{
    $templates = [
        'signup' => [
            'subject' => 'Your RapiReport Account is Almost Ready',
            'title' => 'Verify Your New RapiReport Account',
            'message' => 'To complete your registration, please use the following verification code to confirm your email address:'
        ],
        'forgot' => [
            'subject' => 'Reset Your Password',
            'title' => 'Reset Your Password',
            'message' => 'We received a request to reset the password for your RapiReport account. Please use the following verification code:'
        ]
    ];

    $config = $templates[$type];
    $body = getOTPTemplate($otp, $config['title'], $config['message']);

    return sendEmail($email, $config['subject'], $body);
}

function sendFamilyInvitationEmail($email, $inviterName, $relation, $acceptLink, $rejectLink)
{
    $subject = "Family Invitation from $inviterName on RapiReport";
    $body = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #334155; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
            .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-top: 40px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
            .content { padding: 40px 30px; text-align: center; }
            .content p { font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
            .inviter-box { background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .inviter-box h2 { margin: 0; font-size: 18px; color: #1e293b; }
            .inviter-box span { color: #3b82f6; font-weight: bold; }
            .btn-group { margin-top: 30px; display: flex; justify-content: center; gap: 15px; }
            .btn { display: inline-block; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; transition: background-color 0.2s; font-size: 15px; }
            .btn-accept { background-color: #10b981; color: #ffffff; }
            .btn-accept:hover { background-color: #059669; }
            .btn-reject { background-color: #ef4444; color: #ffffff; }
            .btn-reject:hover { background-color: #dc2626; }
            .footer { text-align: center; padding: 25px; font-size: 13px; color: #94a3b8; }
            .footer p { margin: 5px 0; }
        </style>
    </head>
    <body>
        <div class='wrapper'>
            <div class='main'>
                <div class='header'>
                    <h1>RAPIREPORT</h1>
                </div>
                <div class='content'>
                    <div class='inviter-box'>
                        <h2><span>$inviterName</span> want to add you to their family!</h2>
                    </div>
                    <p>Hello there,</p>
                    <p>You've been invited as a <strong>$relation</strong>. Joining a family on RapiReport allows you to securely share health records and monitor the wellbeing of your loved ones in real-time.</p>
                    
                    <div class='btn-group'>
                        <a href='$acceptLink' class='btn btn-accept'>Accept Invitation</a>
                        <a href='$rejectLink' class='btn btn-reject'>Decline</a>
                    </div>
                    
                    <p style='margin-top: 30px; font-size: 14px; color: #64748b;'>Need help? Visit our <a href='https://harmanbhuju.com.np' style='color: #3b82f6;'>Help Center</a></p>
                </div>
                <div class='footer'>
                    <p>&copy; 2026 RapiReport. All rights reserved.</p>
                    <p>This invitation was sent because someone cares about your health.</p>
                </div>
            </div>
        </div>
    </body>
    </html>";

    return sendEmail($email, $subject, $body);
}

function sendAccountCreatedEmail($email)
{
    $subject = 'Your RapiReport Account is Ready!';
    $body = getAccountCreatedTemplate();

    return sendEmail($email, $subject, $body);
}

function sendSellerAccountCreatedEmail($email)
{
    $subject = 'Your RapiReport Seller Account is Ready!';
    $body = getSellerAccountCreatedTemplate();

    return sendEmail($email, $subject, $body);
}

function sendTeacherPendingVerificationEmail($email, $teacher_name)
{
    $subject = 'Your RapiReport Teacher Account is Under Review';
    $body = getTeacherPendingVerificationTemplate($teacher_name);

    return sendEmail($email, $subject, $body);
}

function sendTeacherVerifiedEmail($email, $teacher_name)
{
    $subject = 'Your RapiReport Teacher Account is Verified! 🎉';
    $body = getTeacherVerifiedTemplate($teacher_name);

    return sendEmail($email, $subject, $body);
}

function sendAccountDeletedEmail($email)
{
    date_default_timezone_set('Asia/Kathmandu');
    $deleted_at = date('F j, Y, g:i A');

    $subject = 'Your RapiReport Account is Deleted';
    $body = getAccountDeletedTemplate($deleted_at);

    return sendEmail($email, $subject, $body);
}

function getOTPTemplate($otp, $title, $message)
{
    return "
    <html>
    <head>
        <style>
            .code-box {
                display: inline-block;
                background-color: #f0f0f0;
                padding: 15px 25px;
                font-size: 24px;
                font-weight: bold;
                letter-spacing: 6px;
                border-radius: 8px;
                user-select: all;
                margin-top: 20px;
            }
        </style>
    </head>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; font-size: 15px; max-width: 600px; margin: auto; padding: 20px;'>
        <h1 style='font-size: 26px; margin-bottom: 15px; font-weight: bold; color: #4a90e2;'>{$title}</h1>
        <p>{$message}</p>
        <div class='code-box'>{$otp}</div>
        <p style='margin-top: 20px; font-size: 14px; color: #555;'>
            If you did not request this, please ignore this email. Your account is safe.
        </p>
        <p>Thanks,<br>The <span style='color:red;'>RapiReport</span> Team</p>
    </body>
    </html>";
}

function getAccountCreatedTemplate()
{
    return "
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: #f2f5f7;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                padding: 20px;
            }
            .card {
                background: #ffffff;
                border-radius: 14px;
                box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                padding: 40px 30px;
                text-align: center;
            }
            .title {
                font-size: 30px;
                font-weight: bold;
                color: #4a90e2;
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: #555555;
                margin-bottom: 30px;
                line-height: 1.6;
            }
            .highlight-box {
                display: inline-block;
                background: linear-gradient(90deg, #ffb347, #ffcc33);
                color: #ffffff;
                padding: 18px 40px;
                font-size: 20px;
                font-weight: bold;
                border-radius: 10px;
                letter-spacing: 1px;
                box-shadow: 0 5px 12px rgba(0,0,0,0.2);
            }
            .footer {
                margin-top: 35px;
                font-size: 14px;
                color: #777777;
                line-height: 1.5;
            }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='card'>
                <div class='title'>Thank You for Joining RapiReport!</div>
                <div class='message'>
                    We're thrilled to have you on board. Your account has been successfully created, and you now have full access to explore, connect, and enjoy everything <strong>RapiReport</strong> offers.
                </div>
                <div class='highlight-box'>Account Created Successfully 🎉</div>
                <div class='footer'>
                    If you did not create this account, please contact our support immediately.<br>
                    We're excited to have you with us!<br>- The <span style='color:red;'>RapiReport</span> Team
                </div>
            </div>
        </div>
    </body>
    </html>";
}

function getTeacherPendingVerificationTemplate($teacher_name)
{
    return "
    <html>
    <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <style>
            body {
                font-family: Arial, sans-serif;
                background: #f2f5f7;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                padding: 20px;
            }
            .card {
                background: #ffffff;
                border-radius: 14px;
                box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                padding: 40px 30px;
            }
            .title {
                font-size: 28px;
                font-weight: bold;
                color: #f59e0b;
                margin-bottom: 20px;
                text-align: center;
            }
            .subtitle {
                font-size: 18px;
                color: #6b7280;
                text-align: center;
                margin-bottom: 30px;
            }
            .message {
                font-size: 16px;
                color: #374151;
                margin-bottom: 20px;
                line-height: 1.6;
            }
            .status-box {
                display: block;
                background: linear-gradient(90deg, #fbbf24, #f59e0b);
                color: #ffffff;
                padding: 20px;
                font-size: 20px;
                font-weight: bold;
                border-radius: 10px;
                text-align: center;
                margin: 25px 0;
                letter-spacing: 0.5px;
            }
            .info-section {
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
            }
            .info-title {
                font-size: 16px;
                font-weight: bold;
                color: #92400e;
                margin-bottom: 12px;
            }
            .info-list {
                margin: 0;
                padding-left: 20px;
                color: #78350f;
            }
            .info-list li {
                margin-bottom: 8px;
                line-height: 1.5;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
                line-height: 1.6;
            }
            .emoji {
                font-size: 48px;
                text-align: center;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='emoji'>⏳</div>
            <div class='title'>Teacher Account Submitted for Review</div>
            <div class='subtitle'>Welcome, {$teacher_name}!</div>
            
            <div class='message'>
                Thank you for registering as a teacher on <strong>RapiReport</strong>! 
                We've received your application and our team is currently reviewing your credentials.
            </div>

            <div class='status-box'>
                STATUS: PENDING VERIFICATION
            </div>

            <div class='info-section'>
                <div class='info-title'>📋 What Happens Next?</div>
                <ul class='info-list'>
                    <li>Our team will review your profile and certificates</li>
                    <li>Verification typically takes <strong>5-7 business days</strong></li>
                    <li>You'll receive an email once your account is verified</li>
                    <li>After verification, you can start creating and publishing classes</li>
                </ul>
            </div>

            <div class='info-section'>
                <div class='info-title'>✅ What We're Reviewing:</div>
                <ul class='info-list'>
                    <li>Teaching credentials and certificates</li>
                    <li>Profile information and bio</li>
                    <li>Teaching category alignment</li>
                    <li>Overall profile completeness</li>
                </ul>
            </div>

            <div class='message' style='margin-top: 25px;'>
                <strong>Important:</strong> While your account is under review, you won't be able to create classes yet. 
                We'll notify you as soon as your account is verified!
            </div>

            <div class='footer'>
                If you have any questions or need to update your application, please contact us at 
                <strong>support@rapireport.com</strong><br><br>
                Thank you for your patience!<br>
                - The <span style='color:#e11d48;'>RapiReport</span> Team
            </div>
        </div>
    </body>
    </html>";
}

function getTeacherVerifiedTemplate($teacher_name)
{
    return "
    <html>
    <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <style>
            body {
                font-family: Arial, sans-serif;
                background: #f2f5f7;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                padding: 20px;
            }
            .card {
                background: #ffffff;
                border-radius: 14px;
                box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                padding: 40px 30px;
                text-align: center;
            }
            .title {
                font-size: 30px;
                font-weight: bold;
                color: #10b981;
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: #374151;
                margin-bottom: 30px;
                line-height: 1.6;
                text-align: left;
            }
            .highlight-box {
                display: inline-block;
                background: linear-gradient(90deg, #6cd97c, #10b981);
                color: #ffffff;
                padding: 18px 40px;
                font-size: 20px;
                font-weight: bold;
                border-radius: 10px;
                letter-spacing: 1px;
                box-shadow: 0 5px 12px rgba(0,0,0,0.2);
                margin: 20px 0;
            }
            .cta-button {
                display: inline-block;
                background: #10b981;
                color: #ffffff;
                padding: 15px 40px;
                font-size: 18px;
                font-weight: bold;
                text-decoration: none;
                border-radius: 8px;
                margin: 25px 0;
            }
            .next-steps {
                background: #d1fae5;
                border-left: 4px solid #10b981;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
                text-align: left;
            }
            .next-steps-title {
                font-size: 18px;
                font-weight: bold;
                color: #065f46;
                margin-bottom: 15px;
            }
            .next-steps ul {
                margin: 0;
                padding-left: 20px;
                color: #047857;
            }
            .next-steps li {
                margin-bottom: 10px;
                line-height: 1.5;
            }
            .footer {
                margin-top: 35px;
                font-size: 14px;
                color: #6b7280;
                line-height: 1.5;
            }
            .emoji {
                font-size: 64px;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='card'>
                <div class='emoji'>🎉</div>
                <div class='title'>Congratulations, {$teacher_name}!</div>
                
                <div class='message'>
                    Great news! Your teacher account has been <strong>successfully verified</strong>. 
                    You are now approved to teach on <strong>RapiReport</strong> and can start creating classes right away!
                </div>

                <div class='highlight-box'>✅ ACCOUNT VERIFIED</div>

                <div class='next-steps'>
                    <div class='next-steps-title'>🚀 What You Can Do Now:</div>
                    <ul>
                        <li>Create and publish your first class</li>
                        <li>Set your class schedule and pricing</li>
                        <li>Share your cultural expertise with students</li>
                        <li>Start earning through teaching</li>
                        <li>Build your reputation and grow your student base</li>
                    </ul>
                </div>

                <div class='message'>
                    <strong>Pro Tip:</strong> Complete classes with engaging descriptions and clear learning 
                    objectives tend to attract more students. Don't forget to showcase your unique teaching style!
                </div>

                <div class='footer'>
                    Ready to start your teaching journey? Log in to your account and create your first class!<br><br>
                    If you need any help, our support team is here for you at <strong>support@rapireport.com</strong><br><br>
                    Welcome to the RapiReport teaching community!<br>
                    - The <span style='color:#e11d48;'>RapiReport</span> Team
                </div>
            </div>
        </div>
    </body>
    </html>";
}

function getAccountDeletedTemplate($deleted_at)
{
    return "
    <html>
    <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <style>
            body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                font-size: 15px; 
                max-width: 700px; 
                margin: auto; 
                padding: 20px; 
                color: #333; 
            }
            .container { 
                background: #ffffff; 
                padding: 28px; 
                border-radius: 12px; 
                box-shadow: 0 6px 24px rgba(0,0,0,0.08); 
            }
            .headline { 
                font-size: 26px; 
                margin-bottom: 8px; 
                font-weight: 700; 
                color: #e53e3e; 
            }
            .sub { 
                color: #6b7280; 
                margin-bottom: 18px; 
                font-size: 15px; 
            }
            .notice-box {
                display: block;
                background-color: #fff3f2;
                border: 1px solid #ffe4e2;
                padding: 18px 22px;
                font-size: 20px;
                font-weight: 700;
                letter-spacing: 0.6px;
                border-radius: 10px;
                color: #b91c1c;
                text-align: center;
                margin: 18px 0;
                user-select: none;
            }
            .muted { 
                font-size: 13px; 
                color: #6b7280; 
                margin-top: 12px; 
            }
            .footer { 
                margin-top: 20px; 
                font-size: 14px; 
                color: #374151; 
            }
            .warning-emoji { 
                font-size: 28px; 
                margin-right: 8px; 
                vertical-align: middle; 
            }
            @media (max-width: 520px){
                .container { padding: 18px; }
                .notice-box { font-size: 18px; padding: 14px; }
            }
        </style>
    </head>
    <body>
        <div class='container'>
            <h1 class='headline'>Account Deleted — Irreversible</h1>
            <p class='sub'>
                We're writing to confirm that your RapiReport account has been <strong>permanently deleted</strong>.
                All of your profile data, posts, and other associated information have been removed and cannot be recovered.
            </p>
            <div class='notice-box'>
                <span class='warning-emoji'>⚠️</span>
                THIS ACCOUNT HAS BEEN PERMANENTLY DELETED
            </div>
            <p class='muted'>
                If this was done in error or you think someone else deleted your account without permission,
                please contact our support team <strong>immediately</strong>. We may be able to help if the deletion is very recent,
                but in most cases deletions are final.
            </p>
            <p class='footer'>
                Thank you for being part of <strong>RapiReport</strong>.<br/>
                — The <span style='color:#e11d48;'>RapiReport</span> Team
            </p>
            <p style='margin-top:18px; font-size:13px; color:#9ca3af;'>
                <em>Deleted on: {$deleted_at}</em>
            </p>
        </div>
    </body>
    </html>";
}

function getSellerAccountCreatedTemplate()
{
    return "<html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: #f2f5f7;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                padding: 20px;
            }
            .card {
                background: #ffffff;
                border-radius: 14px;
                box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                padding: 40px 30px;
                text-align: center;
            }
            .title {
                font-size: 30px;
                font-weight: bold;
                color: #4a90e2;
                margin-bottom: 20px;
            }
            .message {
                font-size: 16px;
                color: #555555;
                margin-bottom: 30px;
                line-height: 1.6;
            }
            .highlight-box {
                display: inline-block;
                background: linear-gradient(90deg, #6cd97c, #3c763d);
                color: #ffffff;
                padding: 18px 40px;
                font-size: 20px;
                font-weight: bold;
                border-radius: 10px;
                letter-spacing: 1px;
                box-shadow: 0 5px 12px rgba(0,0,0,0.2);
            }
            .footer {
                margin-top: 35px;
                font-size: 14px;
                color: #777777;
                line-height: 1.5;
            }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='card'>
                <div class='title'>Your RapiReport Seller Account is Ready!</div>
                <div class='message'>
                    Congratulations! Your seller account has been successfully created. You can now list your products and manage your store efficiently on <strong>RapiReport</strong>.
                </div>
                <div class='highlight-box'>Seller Account Successfully Created ✅</div>
                <div class='footer'>
                    If you did not create this account, please contact our support immediately to secure your information.<br>
                    Welcome aboard!<br>- The <span style='color:red;'>RapiReport</span> Team
                </div>
            </div>
        </div>
    </body>
</html>";
}

function sendTeacherRejectedEmail($email, $teacher_name)
{
    $subject = 'RapiReport Teacher Application Update';
    $body = getTeacherRejectedTemplate($teacher_name);

    return sendEmail($email, $subject, $body);
}

function getTeacherRejectedTemplate($teacher_name)
{
    return "
    <html>
    <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <style>
            body {
                font-family: Arial, sans-serif;
                background: #f2f5f7;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                padding: 20px;
            }
            .card {
                background: #ffffff;
                border-radius: 14px;
                box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                padding: 40px 30px;
            }
            .title {
                font-size: 28px;
                font-weight: bold;
                color: #dc2626;
                margin-bottom: 20px;
                text-align: center;
            }
            .subtitle {
                font-size: 18px;
                color: #6b7280;
                text-align: center;
                margin-bottom: 30px;
            }
            .message {
                font-size: 16px;
                color: #374151;
                margin-bottom: 20px;
                line-height: 1.6;
            }
            .status-box {
                display: block;
                background: linear-gradient(90deg, #ef4444, #dc2626);
                color: #ffffff;
                padding: 20px;
                font-size: 20px;
                font-weight: bold;
                border-radius: 10px;
                text-align: center;
                margin: 25px 0;
                letter-spacing: 0.5px;
            }
            .info-section {
                background: #fee2e2;
                border-left: 4px solid #dc2626;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
            }
            .info-title {
                font-size: 16px;
                font-weight: bold;
                color: #991b1b;
                margin-bottom: 12px;
            }
            .info-list {
                margin: 0;
                padding-left: 20px;
                color: #7f1d1d;
            }
            .info-list li {
                margin-bottom: 8px;
                line-height: 1.5;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
                line-height: 1.6;
            }
            .emoji {
                font-size: 48px;
                text-align: center;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class='container'>
                        <li>Incomplete or unclear teaching credentials</li>
                        <li>Insufficient teaching experience documentation</li>
                        <li>Profile information needs more detail</li>
                        <li>Certificate verification issues</li>
                        <li>Teaching category mismatch</li>
                    </ul>
                </div>

                <div class='message' style='margin-top: 25px;'>
                    <strong>What's Next?</strong><br>
                    You're welcome to reapply in the future with updated credentials and information. 
                    We encourage you to strengthen your profile and teaching documentation before submitting a new application.
                </div>

                <div class='info-section' style='background: #dbeafe; border-left-color: #2563eb;'>
                    <div class='info-title' style='color: #1e40af;'>💡 Tips for Reapplication:</div>
                    <ul class='info-list' style='color: #1e3a8a;'>
                        <li>Ensure all certificates are clear and valid</li>
                        <li>Provide detailed teaching experience</li>
                        <li>Write a comprehensive bio showcasing your expertise</li>
                        <li>Upload high-quality profile pictures</li>
                        <li>Verify all contact information is accurate</li>
                    </ul>
                </div>

                <div class='footer'>
                    If you have questions about this decision or need clarification, please contact us at 
                    <strong>support@cultureconnect.com</strong><br><br>
                    Thank you for your understanding.<br>
                    - The <span style='color:#e11d48;'>CultureConnect</span> Team
                </div>
            </div>
        </div>
    </body>
    </html>";
}
