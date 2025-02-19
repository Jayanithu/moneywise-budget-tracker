const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let authWindow;
const TRANSACTIONS_FILE = path.join(app.getPath('userData'), 'transactions.json');
const USERS_FILE = path.join(app.getPath('userData'), 'users.json');

async function ensureFiles() {
    try {
        await fs.access(TRANSACTIONS_FILE);
    } catch {
        await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify([], null, 2));
    }
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
    }
}

function createAuthWindow() {
    authWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            worldSafeExecuteJavaScript: true,
            sandbox: true
        }
    });

    authWindow.loadFile('login.html');

    if (process.env.NODE_ENV === 'development') {
        authWindow.webContents.openDevTools();
    }
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            worldSafeExecuteJavaScript: true,
            sandbox: true
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        return { action: 'deny' };
    });

    mainWindow.loadFile('index.html');

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(async () => {
    await ensureFiles();
    createAuthWindow();
});

// Handle login
ipcMain.handle('auth:login', async (event, credentials) => {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        const user = users.find(u => 
            u.email === credentials.email && 
            u.password === credentials.password // In production, use proper password hashing
        );
        
        if (user) {
            createMainWindow();
            mainWindow.once('ready-to-show', () => {
                mainWindow.show();
                authWindow.close();
            });
            return { success: true, user: { ...user, password: undefined } };
        }
        return { success: false, error: 'Invalid credentials' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Login failed' };
    }
});

// Handle signup
ipcMain.handle('auth:signup', async (event, userData) => {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        
        // Check if user already exists
        if (users.some(u => u.email === userData.email)) {
            return { success: false, error: 'Email already registered' };
        }

        // Add new user
        const newUser = {
            id: Date.now(),
            ...userData,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        
        createMainWindow();
        mainWindow.once('ready-to-show', () => {
            mainWindow.show();
            authWindow.close();
        });
        
        return { success: true, user: { ...newUser, password: undefined } };
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: 'Signup failed' };
    }
});

// Existing transaction handlers
ipcMain.handle('load-transactions', async (event, userId) => {
    try {
        const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
        const allTransactions = JSON.parse(data);
        // Filter transactions by user ID
        return allTransactions.filter(t => t.userId === userId);
    } catch (error) {
        console.error('Error loading transactions:', error);
        return [];
    }
});

ipcMain.handle('save-transaction', async (event, { transaction, userId }) => {
    try {
        const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
        let transactions = JSON.parse(data);
        const newTransaction = { ...transaction, userId };
        transactions.push(newTransaction);
        await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
        return transactions.filter(t => t.userId === userId);
    } catch (error) {
        console.error('Error in save-transaction handler:', error);
        throw error;
    }
});

ipcMain.handle('delete-transaction', async (event, { id, userId }) => {
    try {
        const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
        let transactions = JSON.parse(data);
        transactions = transactions.filter(t => !(t.id === id && t.userId === userId));
        await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
        return transactions.filter(t => t.userId === userId);
    } catch (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createAuthWindow();
    }
});