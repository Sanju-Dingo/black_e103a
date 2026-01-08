<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
$host = 'localhost:3306';
$dbname = 'learning_ai_db';
$username = 'root';
$password = 'Dingosanju@07'; // Change this to your MySQL password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Create users table if not exists
$createTable = "
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('teacher', 'student') NOT NULL,
    verified TINYINT(1) DEFAULT 0,
    verification_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

try {
    $pdo->exec($createTable);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Table creation failed: ' . $e->getMessage()]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

switch($action) {
    case 'REGISTER':
        registerUser($pdo, $input['data']);
        break;
    case 'LOGIN':
        loginUser($pdo, $input['data']);
        break;
    case 'VERIFY':
        verifyUser($pdo, $input['data']);
        break;
    case 'GET_USERS':
        getAllUsers($pdo);
        break;
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}

function registerUser($pdo, $data) {
    try {
        // Check if user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'error' => 'Email already registered']);
            return;
        }
        
        // Insert new user
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, verification_token) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['email'],
            $data['password'],
            $data['role'],
            $data['verification_token']
        ]);
        
        echo json_encode(['success' => true, 'userId' => $pdo->lastInsertId()]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function loginUser($pdo, $data) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
            return;
        }
        
        if ($user['password'] !== $data['password']) {
            echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
            return;
        }
        
        if (!$user['verified']) {
            echo json_encode(['success' => false, 'error' => 'Please verify your email first']);
            return;
        }
        
        unset($user['password']); // Don't send password back
        echo json_encode(['success' => true, 'user' => $user]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function verifyUser($pdo, $data) {
    try {
        $stmt = $pdo->prepare("UPDATE users SET verified = 1 WHERE email = ? AND verification_token = ?");
        $stmt->execute([$data['email'], $data['token']]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Invalid verification token']);
        }
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function getAllUsers($pdo) {
    try {
        $stmt = $pdo->query("SELECT id, name, email, role, verified, created_at FROM users");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'users' => $users]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>