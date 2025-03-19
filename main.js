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

    mainWindow.loadFile('index.html');
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    await ensureFiles();
    // Instead of creating auth window, directly create main window
    createMainWindow();
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

// Transaction handlers
ipcMain.handle('load-transactions', async () => {
    try {
        const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading transactions:', error);
        return [];
    }
});

ipcMain.handle('save-transaction', async (event, { transaction }) => {
    try {
        const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
        let transactions = JSON.parse(data);
        transactions.push(transaction);
        await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
        return transactions;
    } catch (error) {
        console.error('Error in save-transaction handler:', error);
        throw error;
    }
});

ipcMain.handle('delete-transaction', async (event, { id }) => {
    try {
        const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
        let transactions = JSON.parse(data);
        transactions = transactions.filter(t => t.id !== id);
        await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
        return transactions;
    } catch (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
});

// Budget handlers
ipcMain.handle('load-budgets', async () => {
    try {
        const budgetsFile = path.join(app.getPath('userData'), 'budgets.json');
        try {
            await fs.access(budgetsFile);
        } catch {
            const defaultBudgets = {
                housing: 1000,
                food: 500,
                transportation: 300,
                entertainment: 200,
                utilities: 250,
                other: 300
            };
            await fs.writeFile(budgetsFile, JSON.stringify(defaultBudgets, null, 2));
        }
        
        const data = await fs.readFile(budgetsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading budgets:', error);
        return {};
    }
});

ipcMain.handle('save-budgets', async (event, { budgets }) => {
    try {
        const budgetsFile = path.join(app.getPath('userData'), 'budgets.json');
        await fs.writeFile(budgetsFile, JSON.stringify(budgets, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving budgets:', error);
        return false;
    }
});

// Settings handlers
ipcMain.handle('load-settings', async () => {
    try {
        const settingsFile = path.join(app.getPath('userData'), 'settings.json');
        try {
            await fs.access(settingsFile);
        } catch {
            // Create default settings if file doesn't exist
            const defaultSettings = {
                notifications: false,
                currency: 'USD',
                dateFormat: 'MM/DD/YYYY'
            };
            await fs.writeFile(settingsFile, JSON.stringify(defaultSettings, null, 2));
        }
        
        const data = await fs.readFile(settingsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading settings:', error);
        return {};
    }
});

ipcMain.handle('save-settings', async (event, { settings }) => {
    try {
        const settingsFile = path.join(app.getPath('userData'), 'settings.json');
        await fs.writeFile(settingsFile, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
});

// Add clear-data handler to match the one in preload.js
ipcMain.handle('clear-data', async () => {
    try {
        // Clear transactions
        await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify([], null, 2));
        
        // Reset budgets to defaults
        const defaultBudgets = {
            housing: 1000,
            food: 500,
            transportation: 300,
            entertainment: 200,
            utilities: 250,
            other: 300
        };
        const budgetsFile = path.join(app.getPath('userData'), 'budgets.json');
        await fs.writeFile(budgetsFile, JSON.stringify(defaultBudgets, null, 2));
        
        // Reset settings to defaults
        const defaultSettings = {
            notifications: false,
            currency: 'USD',
            dateFormat: 'MM/DD/YYYY'
        };
        const settingsFile = path.join(app.getPath('userData'), 'settings.json');
        await fs.writeFile(settingsFile, JSON.stringify(defaultSettings, null, 2));
        
        return true;
    } catch (error) {
        console.error('Error clearing data:', error);
        return false;
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