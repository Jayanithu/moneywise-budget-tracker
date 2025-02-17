const { ipcRenderer } = require('electron');

// Select Elements
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const transactionList = document.getElementById('transaction-list');
const balanceElement = document.getElementById('balance');

let transactions = [];

// Load Transactions on App Start
async function loadTransactions() {
    transactions = await ipcRenderer.invoke('load-transactions');
    updateUI();
}

// Add Transaction Function
function addTransaction() {
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    if (description === "" || isNaN(amount)) {
        alert("Please enter a valid description and amount!");
        return;
    }

    const transaction = { description, amount, category };
    transactions.push(transaction);

    // Send transaction to main process to save in JSON
    ipcRenderer.send('save-transaction', transaction);
    
    updateUI();

    // Clear Input Fields
    descriptionInput.value = "";
    amountInput.value = "";
}

// Update UI Function
function updateUI() {
    transactionList.innerHTML = "";
    let balance = 0;

    transactions.forEach((transaction) => {
        const li = document.createElement('li');
        li.textContent = `${transaction.description}: $${transaction.amount}`;
        li.classList.add(transaction.category === "income" ? "income" : "expense");
        transactionList.appendChild(li);

        balance += transaction.category === "income" ? transaction.amount : -transaction.amount;
    });

    balanceElement.textContent = balance;
}

// Ensure "Add Transaction" button works
document.getElementById("addTransactionBtn").addEventListener("click", addTransaction);

// Load Transactions on Start
loadTransactions();
