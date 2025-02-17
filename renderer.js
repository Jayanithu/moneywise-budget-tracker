const { ipcRenderer } = require('electron');

const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const transactionList = document.getElementById('transaction-list');
const balanceElement = document.getElementById('balance');

let transactions = [];

async function loadTransactions() {
    transactions = await ipcRenderer.invoke('load-transactions');
    updateUI();
}

function addTransaction() {
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    if (description === "" || isNaN(amount)) return alert("Please enter valid details!");

    const transaction = { description, amount, category };
    transactions.push(transaction);
    ipcRenderer.send('save-transaction', transaction);
    
    updateUI();
    descriptionInput.value = "";
    amountInput.value = "";
}

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
    updateChart();
}

function updateChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const categories = { food: 0, rent: 0, entertainment: 0, others: 0 };

    transactions.forEach((t) => {
        if (t.category !== "income") categories[t.category] += t.amount;
    });

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['red', 'blue', 'green', 'purple']
            }]
        }
    });
}

loadTransactions();
