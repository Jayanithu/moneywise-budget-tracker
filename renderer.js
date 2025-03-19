let transactions = [];

async function loadTransactions() {
    try {
        // No need to check for userId
        transactions = await window.electronAPI.loadTransactions();
        updateUI();
    } catch (error) {
        console.error('Failed to load transactions:', error);
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-circle';
    if (type === 'warning') icon = 'alert-triangle';
    
    toast.innerHTML = `
        <i data-lucide="${icon}" class="toast-icon"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    lucide.createIcons();
    
    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide and remove the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Use the toast notification when adding a transaction
async function addTransaction(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    
    if (!description || isNaN(amount) || !date) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    const transaction = {
        id: Date.now(),
        description,
        amount,
        category,
        date
    };
    
    try {
        transactions = await window.electronAPI.saveTransaction(transaction);
        updateUI();
        
        // Reset form
        document.getElementById('transaction-form').reset();
        
        showToast('Transaction added successfully', 'success');
    } catch (error) {
        console.error('Failed to save transaction:', error);
        showToast('Failed to save transaction', 'error');
    }
}

// Use toast notification when deleting a transaction
async function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        try {
            transactions = await window.electronAPI.deleteTransaction(id);
            updateUI();
            showToast('Transaction deleted', 'success');
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            showToast('Failed to delete transaction', 'error');
        }
    }
}

function updateUI() {
    const transactionList = document.getElementById('transaction-list');
    const balanceElement = document.getElementById('balance');
    
    if (!transactionList || !balanceElement) return;
    
    transactionList.innerHTML = "";
    let balance = 0;

    transactions.forEach((transaction) => {
        const li = document.createElement('li');
        const formattedAmount = transaction.amount.toFixed(2);
        const date = new Date(transaction.date).toLocaleDateString();
        
        li.innerHTML = `
            <span class="transaction-date">${date}</span>
            <span class="transaction-desc">${escapeHtml(transaction.description)}</span>
            <span class="transaction-amount ${transaction.category === "income" ? "income" : "expense"}">
                ${transaction.category === "income" ? "+" : "-"}$${formattedAmount}
            </span>
            <button onclick="deleteTransaction(${transaction.id})" class="delete-btn">Delete</button>
        `;
        
        li.classList.add(transaction.category === "income" ? "income" : "expense");
        transactionList.appendChild(li);

        balance += transaction.category === "income" ? transaction.amount : -transaction.amount;
    });

    balanceElement.textContent = balance.toFixed(2);
}

async function deleteTransaction(id) {
    try {
        // No need to pass userId
        transactions = await window.electronAPI.deleteTransaction(id);
        updateUI();
    } catch (error) {
        console.error('Failed to delete transaction:', error);
        alert('Failed to delete transaction. Please try again.');
    }
}

function resetForm() {
    const form = document.getElementById('transactionForm');
    if (form) form.reset();
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function toggleDarkMode(event) {
    const isDarkMode = event.target.checked;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
}

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        themeToggle.checked = isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        themeToggle.addEventListener('change', toggleDarkMode);
    }

    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', addTransaction);
    }

    const form = document.getElementById('transactionForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            addTransaction();
        });
    }

    loadTransactions();
});