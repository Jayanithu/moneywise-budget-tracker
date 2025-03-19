let currentUser = null;
let budgets = {
    housing: 1000,
    food: 500,
    transportation: 300,
    entertainment: 200,
    utilities: 250,
    other: 300
};

async function loadUserData() {
    try {
        // Use a default user instead of checking for userId
        currentUser = {
            id: 'default',
            name: 'Default User',
            email: 'user@example.com',
            avatar: null
        };
        
        // Load budgets directly from localStorage
        const storedBudgets = localStorage.getItem('budgets');
        if (storedBudgets) {
            budgets = JSON.parse(storedBudgets);
        }
        
        populateFormFields();
    } catch (error) {
        console.error('Failed to load user data:', error);
    }
}

function populateFormFields() {
    // Populate profile form
    document.getElementById('fullName').value = currentUser.name || '';
    document.getElementById('email').value = currentUser.email || '';
    
    if (currentUser.avatar) {
        document.getElementById('avatarPreview').src = currentUser.avatar;
    }
    
    // Populate budget form
    document.getElementById('housingBudget').value = budgets.housing || '';
    document.getElementById('foodBudget').value = budgets.food || '';
    document.getElementById('transportationBudget').value = budgets.transportation || '';
    document.getElementById('entertainmentBudget').value = budgets.entertainment || '';
    document.getElementById('utilitiesBudget').value = budgets.utilities || '';
    document.getElementById('otherBudget').value = budgets.other || '';
    
    // Populate app settings
    const appSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    document.getElementById('enableNotifications').checked = appSettings.notifications || false;
    
    if (appSettings.currency) {
        document.getElementById('currency').value = appSettings.currency;
    }
    
    if (appSettings.dateFormat) {
        document.getElementById('dateFormat').value = appSettings.dateFormat;
    }
}

async function saveProfile(e) {
    e.preventDefault();
    
    const name = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    
    // Update user data
    currentUser.name = name;
    currentUser.email = email;
    
    // In a real app, you would send this to the backend
    // For demo purposes, we'll just show a success message
    showToast('Profile updated successfully');
}

async function saveBudget(e) {
    e.preventDefault();
    
    // Update budget data
    budgets.housing = parseFloat(document.getElementById('housingBudget').value) || 0;
    budgets.food = parseFloat(document.getElementById('foodBudget').value) || 0;
    budgets.transportation = parseFloat(document.getElementById('transportationBudget').value) || 0;
    budgets.entertainment = parseFloat(document.getElementById('entertainmentBudget').value) || 0;
    budgets.utilities = parseFloat(document.getElementById('utilitiesBudget').value) || 0;
    budgets.other = parseFloat(document.getElementById('otherBudget').value) || 0;
    
    // Save to localStorage (in a real app, you would save to the backend)
    localStorage.setItem('budgets', JSON.stringify(budgets));
    
    showToast('Budget updated successfully');
}

async function saveAppSettings(e) {
    e.preventDefault();
    
    const enableNotifications = document.getElementById('enableNotifications').checked;
    const currency = document.getElementById('currency').value;
    const dateFormat = document.getElementById('dateFormat').value;
    
    const appSettings = {
        notifications: enableNotifications,
        currency: currency,
        dateFormat: dateFormat
    };
    
    // Save to localStorage
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
    
    showToast('Settings updated successfully');
}

function handleAvatarChange() {
    const avatarInput = document.getElementById('avatar');
    const file = avatarInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatarPreview').src = e.target.result;
            currentUser.avatar = e.target.result;
            // In a real app, you would upload this to the server
        };
        reader.readAsDataURL(file);
    }
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all your data? This action cannot be undone.')) {
        // Clear transactions
        localStorage.removeItem('transactions');
        
        // Reset budgets to defaults
        budgets = {
            housing: 1000,
            food: 500,
            transportation: 300,
            entertainment: 200,
            utilities: 250,
            other: 300
        };
        localStorage.setItem('budgets', JSON.stringify(budgets));
        
        // Reload form fields
        populateFormFields();
        
        showToast('All data has been cleared');
    }
}

function deleteAccount() {
    if (confirm('Are you sure you want to clear all your data? This action cannot be undone.')) {
        // Just clear local storage
        localStorage.clear();
        
        // Reload the page
        window.location.reload();
    }
}

function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function toggleDarkMode(event) {
    const isDarkMode = event.target.checked;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
}

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    // Set up theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        themeToggle.checked = isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        themeToggle.addEventListener('change', toggleDarkMode);
    }
    
    // Set up form submissions
    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    document.getElementById('budgetForm').addEventListener('submit', saveBudget);
    document.getElementById('appSettingsForm').addEventListener('submit', saveAppSettings);
    
    // Set up avatar change
    document.getElementById('avatar').addEventListener('change', handleAvatarChange);
    
    // Set up danger zone buttons
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
    document.getElementById('deleteAccountBtn').addEventListener('click', deleteAccount);
    
    // Load user data
    loadUserData();
});
