# MySQL Database Setup Instructions

## 🔧 **Setup Steps:**

### **1. Create MySQL Database:**
1. Open **MySQL Workbench**
2. Connect to your local MySQL server
3. Run this SQL command:
   ```sql
   CREATE DATABASE learning_ai_db;
   ```

### **2. Update Database Configuration:**
1. Open `api.php`
2. Update these lines with your MySQL credentials:
   ```php
   $host = 'localhost';
   $dbname = 'learning_ai_db';
   $username = 'root';
   $password = 'YOUR_MYSQL_PASSWORD'; // Change this
   ```

### **3. Setup Local Server:**
1. **Install XAMPP** or **WAMP** (includes Apache + PHP)
2. **Start Apache** service
3. **Copy project folder** to `htdocs` (XAMPP) or `www` (WAMP)
4. **Access via**: `http://localhost/a_black/`

### **4. Update API URL:**
1. Open `mysql-db.js`
2. Update the API URL if needed:
   ```javascript
   this.apiURL = 'http://localhost/a_black/api.php';
   ```

### **5. Test the System:**
1. Go to `http://localhost/a_black/login.html`
2. Sign up with test account
3. Check MySQL Workbench for data
4. Test login functionality

## 📊 **Database Structure:**
The API will automatically create a `users` table with:
- id (AUTO_INCREMENT PRIMARY KEY)
- name (VARCHAR)
- email (VARCHAR UNIQUE)
- password (VARCHAR)
- role (ENUM: teacher/student)
- verified (TINYINT)
- verification_token (VARCHAR)
- created_at (TIMESTAMP)

## 🔍 **View Database:**
In MySQL Workbench, run:
```sql
USE learning_ai_db;
SELECT * FROM users;
```

## 🚀 **Benefits:**
- ✅ Local MySQL database
- ✅ Fast performance
- ✅ Full control over data
- ✅ Professional database system
- ✅ Easy to backup/restore

## 🔒 **Security:**
- Passwords are base64 encoded (upgrade to bcrypt for production)
- Local database (not accessible from internet)
- CORS enabled for local development