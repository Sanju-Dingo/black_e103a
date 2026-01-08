// MySQL Database Service
class MySQLDB {
    constructor() {
        this.apiURL = 'http://localhost/a_black/api.php'; // Update path as needed
    }

    async saveUser(userData) {
        try {
            const response = await fetch(this.apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'REGISTER',
                    data: userData
                })
            });

            const result = await response.json();
            if (result.success) {
                return result.userId;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            const response = await fetch(this.apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'LOGIN',
                    data: { email: email, password: 'temp' } // We'll validate properly in login
                })
            });

            const result = await response.json();
            return result.success ? result.user : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async loginUser(email, password) {
        try {
            const response = await fetch(this.apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'LOGIN',
                    data: { email: email, password: password }
                })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error logging in:', error);
            return { success: false, error: error.message };
        }
    }

    async verifyUser(email, token) {
        try {
            const response = await fetch(this.apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'VERIFY',
                    data: { email: email, token: token }
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error verifying user:', error);
            return false;
        }
    }

    async getAllUsers() {
        try {
            const response = await fetch(this.apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'GET_USERS'
                })
            });

            const result = await response.json();
            return result.success ? result.users : [];
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.MySQLDB = MySQLDB;
}