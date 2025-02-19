const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadTransactions: () => ipcRenderer.invoke('load-transactions'),
    saveTransaction: (transaction) => ipcRenderer.invoke('save-transaction', transaction),
    deleteTransaction: (id) => ipcRenderer.invoke('delete-transaction', id)
});