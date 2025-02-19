const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
const TRANSACTIONS_FILE = path.join(app.getPath('userData'), 'transactions.json');

async function ensureTransactionsFile() {
    try {
        await fs.access(TRANSACTIONS_FILE);
    } catch {
        await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify([], null, 2));
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
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
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(async () => {
    await ensureTransactionsFile();
    createWindow();
});

ipcMain.handle('load-transactions', async () => {
    try {
        const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading transactions:', error);
        return [];
    }
});

ipcMain.handle('save-transaction', async (event, transaction) => {
    try {
        let transactions = [];
        try {
            const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
            transactions = JSON.parse(data);
        } catch (error) {
            console.error('Error reading transactions:', error);
        }
        transactions.push(transaction);
        await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
        return transactions;
    } catch (error) {
        console.error('Error in save-transaction handler:', error);
        throw error;
    }
});

ipcMain.handle('delete-transaction', async (event, id) => {
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});