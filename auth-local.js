// Authentication System with Local Storage
class AuthSystem {
    constructor() {
        this.isSignUp = false;
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
            roleGroup.style.display = 'none';
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
            password: formData.get('password')
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
            
            // Check if user already exists
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (users.find(u => u.email === userData.email)) {
                this.showError('Email already registered');
                return;
            }
            
            // Save user to localStorage
            const newUser = {
                id: Date.now(),
                name: userData.name,
                email: userData.email,
                password: btoa(userData.password),
                role: role,
                verified: true
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            // Auto login
            localStorage.setItem('currentUser', JSON.stringify({
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }));
            
            // Redirect based on role
            if (role === 'teacher') {
                window.location.href = 'teacher.html';
            } else {
                window.location.href = 'student.html';
            }
            
        } catch (error) {
            this.showError('Registration failed: ' + error.message);
        }
    }

    async signIn(userData) {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === userData.email && u.password === btoa(userData.password));
            
            if (!user) {
                this.showError('Invalid email or password');
                return;
            }
            
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

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
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