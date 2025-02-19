const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Auth methods
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    signup: (userData) => ipcRenderer.invoke('auth:signup', userData),
    logout: () => ipcRenderer.invoke('auth:logout'),
    
    // Transaction methods
    loadTransactions: (userId) => ipcRenderer.invoke('load-transactions', userId),
    saveTransaction: (transaction, userId) => 
        ipcRenderer.invoke('save-transaction', { transaction, userId }),
    deleteTransaction: (id, userId) => 
        ipcRenderer.invoke('delete-transaction', { id, userId })
});