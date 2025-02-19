let transactions = [];

async function loadTransactions() {
    try {
        transactions = await window.electronAPI.loadTransactions();
        updateUI();
    } catch (error) {
        console.error('Failed to load transactions:', error);
    }
}

async function addTransaction() {
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category');
    
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    if (description === "" || isNaN(amount)) {
        alert("Please enter a valid description and amount!");
        return;
    }

    const transaction = {
        id: Date.now(),
        description,
        amount: Number(amount.toFixed(2)),
        category,
        date: new Date().toISOString()
    };

    try {
        const result = await window.electronAPI.saveTransaction(transaction);
        if (Array.isArray(result)) {
            transactions = result;
            updateUI();
            resetForm();
        }
    } catch (error) {
        console.error('Failed to save transaction:', error);
        alert('Failed to save transaction. Please try again.');
    }
}

function updateUI() {
    const transactionList = document.getElementById('transaction-list');
    const balanceElement = document.getElementById('balance');
    
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
        transactions = await window.electronAPI.deleteTransaction(id);
        updateUI();
    } catch (error) {
        console.error('Failed to delete transaction:', error);
        alert('Failed to delete transaction. Please try again.');
    }
}

function resetForm() {
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('category').value = 'expense';
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
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', isDarkMode);
}

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Set initial state based on localStorage
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        themeToggle.checked = isDarkMode;
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }

        // Add event listener
        themeToggle.addEventListener('change', toggleDarkMode);
    }

    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addTransaction();
        });
    }

    loadTransactions();
});