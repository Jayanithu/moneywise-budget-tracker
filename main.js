const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.loadFile('index.html');
});

// Handle Saving Transaction to JSON File
ipcMain.on('save-transaction', (event, transaction) => {
    const filePath = path.join(__dirname, 'data.json');

    fs.readFile(filePath, (err, data) => {
        let transactions = [];
        if (!err) transactions = JSON.parse(data);
        
        transactions.push(transaction);

        fs.writeFile(filePath, JSON.stringify(transactions, null, 2), (err) => {
            if (err) console.error('Error saving transaction:', err);
        });
    });
});

// Load Transactions
ipcMain.handle('load-transactions', async () => {
    const filePath = path.join(__dirname, 'data.json');

    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
});
