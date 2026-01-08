// Simple Database System with localStorage fallback
class SimpleDB {
    constructor() {
        this.useMySQL = false; // Set to true when MySQL is ready
        this.apiURL = 'http://localhost/a_black/api.php';
    }

    async saveUser(userData) {
        if (this.useMySQL) {
            return await this.saveToMySQL(userData);
        } else {
            return this.saveToLocalStorage(userData);
        }
    }

    async getUserByEmail(email) {
        if (this.useMySQL) {
            return await this.getFromMySQL(email);
        } else {
            return this.getFromLocalStorage(email);
        }
    }

    async verifyUser(email, token) {
        if (this.useMySQL) {
            return await this.verifyInMySQL(email, token);
        } else {
            return this.verifyInLocalStorage(email, token);
        }
    }

    async loginUser(email, password) {
        if (this.useMySQL) {
            return await this.loginMySQL(email, password);
        } else {
            return this.loginLocalStorage(email, password);
        }
    }

    // localStorage methods
    saveToLocalStorage(userData) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const newUser = {
            id: Date.now(),
            ...userData,
            verified: 0,
            created_at: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return newUser.id;
    }

    getFromLocalStorage(email) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(u => u.email === email) || null;
    }

    verifyInLocalStorage(email, token) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === email && u.verification_token === token);
        if (userIndex !== -1) {
            users[userIndex].verified = 1;
            localStorage.setItem('users', JSON.stringify(users));
            return true;
        }
        return false;
    }

    loginLocalStorage(email, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return { success: false, error: 'Invalid email or password' };
        }
        
        if (user.password !== password) {
            return { success: false, error: 'Invalid email or password' };
        }
        
        if (!user.verified) {
            return { success: false, error: 'Please verify your email first' };
        }
        
        return { success: true, user: user };
    }

    // MySQL methods (for when MySQL is set up)
    async saveToMySQL(userData) {
        try {
            const response = await fetch(this.apiURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'REGISTER', data: userData })
            });
            const result = await response.json();
            if (result.success) return result.userId;
            throw new Error(result.error);
        } catch (error) {
            throw error;
        }
    }

    async getFromMySQL(email) {
        try {
            const response = await fetch(this.apiURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'GET_USER', data: { email } })
            });
            const result = await response.json();
            return result.success ? result.user : null;
        } catch (error) {
            return null;
        }
    }

    async verifyInMySQL(email, token) {
        try {
            const response = await fetch(this.apiURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'VERIFY', data: { email, token } })
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            return false;
        }
    }

    async loginMySQL(email, password) {
        try {
            const response = await fetch(this.apiURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'LOGIN', data: { email, password } })
            });
            return await response.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.SimpleDB = SimpleDB;
}