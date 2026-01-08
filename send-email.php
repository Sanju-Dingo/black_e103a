<?php
require 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'sanjith.skvv@gmail.com';
    $mail->Password   = 'mfzn ymgp cgse vssi';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    $mail->setFrom('sanjith.skvv@gmail.com', 'Learning AI System');
    $mail->addAddress($input['email']);

    $verificationLink = "http://localhost/a_black/verify.html?token=" . urlencode($input['token']) . "&email=" . urlencode($input['email']);

    $mail->isHTML(true);
    $mail->Subject = 'Verify Your Learning AI Account';
    $mail->Body    = "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
        <h2>Welcome to Learning AI System!</h2>
        <p>Hello {$input['name']},</p>
        <p>Please click the button below to verify your email:</p>
        <div style='text-align: center; margin: 30px 0;'>
            <a href='$verificationLink' style='background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;'>Verify Email</a>
        </div>
    </div>
    ";

    $mail->send();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $mail->ErrorInfo]);
}
?>