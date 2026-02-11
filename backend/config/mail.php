<?php


use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/php_mailer/Exception.php';
require __DIR__ . '/php_mailer/PHPMailer.php';
require __DIR__ . '/php_mailer/SMTP.php';


function sendResponseAndContinue($data)
{
    $response = json_encode($data);

    // Send response to client immediately
    header("Connection: close");
    header("Content-Type: application/json");
    header("Content-Length: " . strlen($response));

    echo $response;

    // Flush all output buffers
    if (ob_get_level() > 0) {
        ob_end_flush();
    }
    flush();

    // Continue processing even if user closes connection
    ignore_user_abort(true);
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

        $email_template = $custom_template;

        $mail->Body = $email_template;
        $mail->send();
    } catch (Exception $e) {
        error_log("Email Error: {$mail->ErrorInfo}");
        return false;
    }
}

function sendOTPEmail($email, $otp, $type = 'signup')
{
    $templates = [
        'signup' => [
            'subject' => 'Your CultureConnect Account is Almost Ready',
            'title' => 'Verify Your New CultureConnect Account',
            'message' => 'To complete your registration, please use the following verification code to confirm your email address:'
        ],
        'forgot' => [
            'subject' => 'Reset Your Password',
            'title' => 'Reset Your Password',
            'message' => 'We received a request to reset the password for your CultureConnect account. Please use the following verification code:'
        ]
    ];

    $config = $templates[$type];
    $body = getOTPTemplate($otp, $config['title'], $config['message']);

    return sendEmail($email, $config['subject'], $body);
}

function sendAccountCreatedEmail($email)
{
    $subject = 'Your CultureConnect Account is Ready!';
    $body = getAccountCreatedTemplate();

    return sendEmail($email, $subject, $body);
}

function sendSellerAccountCreatedEmail($email)
{
    $subject = 'Your CultureConnect Seller Account is Ready!';
    $body = getSellerAccountCreatedTemplate();

    return sendEmail($email, $subject, $body);
}

function sendTeacherPendingVerificationEmail($email, $teacher_name)
{
    $subject = 'Your CultureConnect Teacher Account is Under Review';
    $body = getTeacherPendingVerificationTemplate($teacher_name);

    return sendEmail($email, $subject, $body);
}

function sendTeacherVerifiedEmail($email, $teacher_name)
{
    $subject = 'Your CultureConnect Teacher Account is Verified! 🎉';
    $body = getTeacherVerifiedTemplate($teacher_name);

    return sendEmail($email, $subject, $body);
}

function sendAccountDeletedEmail($email)
{
    date_default_timezone_set('Asia/Kathmandu');
    $deleted_at = date('F j, Y, g:i A');

    $subject = 'Your CultureConnect Account is Deleted';
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
        <p>Thanks,<br>The <span style='color:red;'>CultureConnect</span> Team</p>
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
                <div class='title'>Thank You for Joining CultureConnect!</div>
                <div class='message'>
                    We're thrilled to have you on board. Your account has been successfully created, and you now have full access to explore, connect, and enjoy everything <strong>CultureConnect</strong> offers.
                </div>
                <div class='highlight-box'>Account Created Successfully 🎉</div>
                <div class='footer'>
                    If you did not create this account, please contact our support immediately.<br>
                    We're excited to have you with us!<br>- The <span style='color:red;'>CultureConnect</span> Team
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
            <div class='card'>
                <div class='emoji'>⏳</div>
                <div class='title'>Teacher Account Submitted for Review</div>
                <div class='subtitle'>Welcome, {$teacher_name}!</div>
                
                <div class='message'>
                    Thank you for registering as a teacher on <strong>CultureConnect</strong>! 
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
                    <strong>support@cultureconnect.com</strong><br><br>
                    Thank you for your patience!<br>
                    - The <span style='color:#e11d48;'>CultureConnect</span> Team
                </div>
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
                    You are now approved to teach on <strong>CultureConnect</strong> and can start creating classes right away!
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
                    If you need any help, our support team is here for you at <strong>support@cultureconnect.com</strong><br><br>
                    Welcome to the CultureConnect teaching community!<br>
                    - The <span style='color:#e11d48;'>CultureConnect</span> Team
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
                We're writing to confirm that your CultureConnect account has been <strong>permanently deleted</strong>.
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
                Thank you for being part of <strong>CultureConnect</strong>.<br/>
                — The <span style='color:#e11d48;'>CultureConnect</span> Team
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
                <div class='title'>Your CultureConnect Seller Account is Ready!</div>
                <div class='message'>
                    Congratulations! Your seller account has been successfully created. You can now list your products and manage your store efficiently on <strong>CultureConnect</strong>.
                </div>
                <div class='highlight-box'>Seller Account Successfully Created ✅</div>
                <div class='footer'>
                    If you did not create this account, please contact our support immediately to secure your information.<br>
                    Welcome aboard!<br>- The <span style='color:red;'>CultureConnect</span> Team
                </div>
            </div>
        </div>
    </body>
</html>";
}

// Add this function to your mail.php file

function sendTeacherRejectedEmail($email, $teacher_name)
{
    $subject = 'CultureConnect Teacher Application Update';
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
            <div class='card'>
                <div class='emoji'>❌</div>
                <div class='title'>Teacher Application Update</div>
                <div class='subtitle'>Hello, {$teacher_name}</div>
                
                <div class='message'>
                    Thank you for your interest in becoming a teacher on <strong>CultureConnect</strong>. 
                    After careful review, we regret to inform you that we are unable to approve your teacher application at this time.
                </div>

                <div class='status-box'>
                    APPLICATION NOT APPROVED
                </div>

                <div class='info-section'>
                    <div class='info-title'>📋 Common Reasons for Non-Approval:</div>
                    <ul class='info-list'>
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
