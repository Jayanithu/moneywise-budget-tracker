const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Transaction methods - removed userId parameter
    loadTransactions: () => ipcRenderer.invoke('load-transactions'),
    saveTransaction: (transaction) => 
        ipcRenderer.invoke('save-transaction', { transaction }),
    deleteTransaction: (id) => 
        ipcRenderer.invoke('delete-transaction', { id }),
        
    // Budget methods - removed userId parameter
    loadBudgets: () => ipcRenderer.invoke('load-budgets'),
    saveBudgets: (budgets) => 
        ipcRenderer.invoke('save-budgets', { budgets }),
        
    // Settings methods - removed userId parameter
    loadSettings: () => ipcRenderer.invoke('load-settings'),
    saveSettings: (settings) => 
        ipcRenderer.invoke('save-settings', { settings }),
        
    // Data management - removed userId parameter
    clearData: () => ipcRenderer.invoke('clear-data'),
});