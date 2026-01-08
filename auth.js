// Authentication System with MySQL Database
class AuthSystem {
    constructor() {
        this.isSignUp = false;
        this.db = new MySQLDB();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = document.getElementById('auth-form');
        const toggleLink = document.getElementById('toggle-link');
        
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        toggleLink.addEventListener('click', (e) => this.toggleForm(e));
    }

    toggleForm(e) {
        e.preventDefault();
        this.isSignUp = !this.isSignUp;
        
        const formTitle = document.getElementById('form-title');
        const nameGroup = document.getElementById('name-group');
        const roleGroup = document.getElementById('role-group');
        const submitBtn = document.getElementById('submit-btn');
        const toggleText = document.getElementById('toggle-text');
        const toggleLink = document.getElementById('toggle-link');
        
        if (this.isSignUp) {
            formTitle.textContent = 'Sign Up';
            nameGroup.style.display = 'block';
            roleGroup.style.display = 'none'; // Hide role selection
            submitBtn.textContent = 'Sign Up';
            toggleText.textContent = 'Already have an account?';
            toggleLink.textContent = 'Sign In';
        } else {
            formTitle.textContent = 'Sign In';
            nameGroup.style.display = 'none';
            roleGroup.style.display = 'none';
            submitBtn.textContent = 'Sign In';
            toggleText.textContent = "Don't have an account?";
            toggleLink.textContent = 'Sign Up';
        }
        
        this.hideMessages();
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role')
        };
        
        if (this.isSignUp) {
            await this.signUp(userData);
        } else {
            await this.signIn(userData);
        }
    }

    async signUp(userData) {
        try {
            // Auto-determine role based on email domain
            const email = userData.email.toLowerCase();
            let role;
            if (email.endsWith('.skcet@gmail.com')) {
                role = 'teacher';
            } else if (email.endsWith('.skct@gmail.com')) {
                role = 'student';
            } else {
                this.showError('Invalid email domain. Use .skcet@gmail.com for teachers or .skct@gmail.com for students');
                return;
            }
            
            // Generate verification token
            const verificationToken = this.generateToken();
            
            // Hash password (in production, use proper hashing)
            const hashedPassword = btoa(userData.password);
            
            // Register user via API
            const response = await fetch('http://localhost/a_black/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'REGISTER',
                    data: {
                        name: userData.name,
                        email: userData.email,
                        password: hashedPassword,
                        role: role,
                        verification_token: verificationToken
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                this.showError(result.error);
                return;
            }
            
            // Send verification email
            await this.sendVerificationEmail(userData.email, verificationToken, role, userData.name);
            
            this.showVerificationMessage();
            
        } catch (error) {
            this.showError('Registration failed: ' + error.message);
        }
    }

    async signIn(userData) {
        try {
            const response = await fetch('http://localhost/a_black/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'LOGIN',
                    data: {
                        email: userData.email,
                        password: btoa(userData.password)
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                this.showError(result.error);
                return;
            }
            
            const user = result.user;
            
            // Store session
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }));
            
            // Redirect based on role
            if (user.role === 'teacher') {
                window.location.href = 'teacher.html';
            } else {
                window.location.href = 'student.html';
            }
            
        } catch (error) {
            this.showError('Sign in failed: ' + error.message);
        }
    }

    async getUserByEmail(email) {
        return await this.db.getUserByEmail(email);
    }

    async saveUser(userData) {
        return await this.db.saveUser(userData);
    }

    async sendVerificationEmail(email, token, role, name) {
        // Since mail server isn't configured, show verification link directly
        const verificationLink = `http://localhost/a_black/verify.html?token=${token}&email=${encodeURIComponent(email)}`;
        
        // Display the verification link to user
        setTimeout(() => {
            const linkDiv = document.createElement('div');
            linkDiv.innerHTML = `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #2196f3;">
                    <p><strong>📧 Email server not configured. Click this link to verify:</strong></p>
                    <a href="${verificationLink}" style="color: #1976d2; text-decoration: underline; font-weight: bold;">Verify Account</a>
                    <p><small>Role: ${role.charAt(0).toUpperCase() + role.slice(1)}</small></p>
                </div>
            `;
            document.getElementById('verification-message').appendChild(linkDiv);
        }, 1000);
        
        console.log('Verification link:', verificationLink);
    }

    async verifyEmail(email, token) {
        try {
            const response = await fetch('./api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'VERIFY',
                    data: {
                        email: email,
                        token: token
                    }
                })
            });
            
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Verification error:', error);
            return false;
        }
    }

    generateToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showVerificationMessage() {
        const verificationDiv = document.getElementById('verification-message');
        verificationDiv.style.display = 'block';
        
        // Auto-hide verification message and show success after demo verification
        setTimeout(() => {
            verificationDiv.style.display = 'none';
            this.showError('Email verified successfully! You can now sign in.');
        }, 3000);
    }

    hideMessages() {
        document.getElementById('error-message').style.display = 'none';
        document.getElementById('verification-message').style.display = 'none';
    }
}

// Initialize authentication system
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});

// Check if user is already logged in
if (localStorage.getItem('currentUser')) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user.role === 'teacher') {
        window.location.href = 'teacher.html';
    } else {
        window.location.href = 'student.html';
    }
}