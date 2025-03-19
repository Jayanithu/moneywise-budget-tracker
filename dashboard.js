let transactions = [];
let currentUser = null;
let budgets = {
    housing: 1000,
    food: 500,
    transportation: 300,
    entertainment: 200,
    utilities: 250,
    other: 300
};

// Sample categories for demonstration
const categories = [
    'Housing', 'Food', 'Transportation', 
    'Entertainment', 'Utilities', 'Other'
];

// Chart color schemes
const chartColors = {
    income: 'rgba(52, 211, 153, 0.8)',
    expense: 'rgba(239, 68, 68, 0.8)',
    categoryColors: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(249, 115, 22, 0.8)'
    ]
};

// Chart instances
let incomeExpenseChart;
let categoryChart;
let trendChart;
let budgetChart;

async function loadTransactions() {
    try {
        // No need to check for userId
        transactions = await window.electronAPI.loadTransactions();
        updateDashboard();
    } catch (error) {
        console.error('Failed to load transactions:', error);
    }
}

function updateDashboard() {
    const periodSelector = document.getElementById('period-selector');
    const selectedPeriod = periodSelector.value;
    
    // Filter transactions based on selected period
    const filteredTransactions = filterTransactionsByPeriod(transactions, selectedPeriod);
    
    // Update metrics
    updateMetrics(filteredTransactions);
    
    // Update charts
    updateCharts(filteredTransactions);
}

function filterTransactionsByPeriod(transactions, period) {
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'quarter':
            const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'all':
        default:
            return transactions;
    }
    
    return transactions.filter(t => new Date(t.date) >= startDate);
}

function updateMetrics(transactions) {
    // Calculate total income
    const totalIncome = transactions
        .filter(t => t.category === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate total expenses
    const totalExpenses = transactions
        .filter(t => t.category === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate net savings
    const netSavings = totalIncome - totalExpenses;
    
    // Update DOM elements
    document.getElementById('total-income').textContent = totalIncome.toFixed(2);
    document.getElementById('total-expenses').textContent = totalExpenses.toFixed(2);
    document.getElementById('net-savings').textContent = netSavings.toFixed(2);
    
    // Calculate total budget
    const totalBudget = Object.values(budgets).reduce((sum, amount) => sum + amount, 0);
    const budgetRemaining = totalBudget - totalExpenses;
    const budgetStatus = budgetRemaining >= 0 ? 'On Track' : 'Over Budget';
    
    document.getElementById('budget-status').textContent = budgetStatus;
    document.getElementById('budget-remaining').textContent = 
        `$${Math.abs(budgetRemaining).toFixed(2)} ${budgetRemaining >= 0 ? 'remaining' : 'over budget'}`;
    
    // Add classes for styling
    document.getElementById('budget-status').className = 
        budgetRemaining >= 0 ? 'metric-value success' : 'metric-value danger';
}

function updateCharts(transactions) {
    updateIncomeExpenseChart(transactions);
    updateCategoryChart(transactions);
    updateTrendChart(transactions);
    updateBudgetChart(transactions);
}

function updateIncomeExpenseChart(transactions) {
    const ctx = document.getElementById('income-expense-chart').getContext('2d');
    
    // Calculate income and expenses by month
    const monthlyData = getMonthlyData(transactions);
    
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }
    
    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Income',
                    data: monthlyData.income,
                    backgroundColor: chartColors.income,
                    borderColor: chartColors.income,
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: monthlyData.expenses,
                    backgroundColor: chartColors.expense,
                    borderColor: chartColors.expense,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

function updateCategoryChart(transactions) {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Filter only expense transactions
    const expenseTransactions = transactions.filter(t => t.category === 'expense');
    
    // Group by category (in a real app, you'd have subcategories)
    // For demo, we'll randomly assign categories
    const categoryTotals = {};
    categories.forEach(cat => categoryTotals[cat] = 0);
    
    expenseTransactions.forEach(t => {
        // Randomly assign a category for demo purposes
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        categoryTotals[randomCategory] += t.amount;
    });
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: chartColors.categoryColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

function updateTrendChart(transactions) {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    
    // Get monthly data
    const monthlyData = getMonthlyData(transactions);
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Income',
                    data: monthlyData.income,
                    borderColor: chartColors.income,
                    backgroundColor: 'transparent',
                    tension: 0.4
                },
                {
                    label: 'Expenses',
                    data: monthlyData.expenses,
                    borderColor: chartColors.expense,
                    backgroundColor: 'transparent',
                    tension: 0.4
                },
                {
                    label: 'Net',
                    data: monthlyData.income.map((inc, i) => inc - monthlyData.expenses[i]),
                    borderColor: 'rgba(59, 130, 246, 0.8)',
                    backgroundColor: 'transparent',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

function updateBudgetChart(transactions) {
    const ctx = document.getElementById('budget-chart').getContext('2d');
    
    // Calculate actual spending by category
    const actualSpending = {};
    categories.forEach(cat => actualSpending[cat] = 0);
    
    // For demo purposes, randomly assign categories
    transactions.filter(t => t.category === 'expense').forEach(t => {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        actualSpending[randomCategory] += t.amount;
    });
    
    if (budgetChart) {
        budgetChart.destroy();
    }
    
    // Prepare data for budget vs actual comparison
    const budgetData = [];
    const actualData = [];
    const labels = [];
    
    for (const category in budgets) {
        if (Object.hasOwnProperty.call(budgets, category)) {
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            labels.push(categoryName);
            budgetData.push(budgets[category]);
            actualData.push(actualSpending[categoryName] || 0);
        }
    }
    
    budgetChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Budget',
                    data: budgetData,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Actual',
                    data: actualData,
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

function getMonthlyData(transactions) {
    const months = [];
    const income = [];
    const expenses = [];
    
    // Get unique months from transactions
    const uniqueMonths = new Set();
    transactions.forEach(t => {
        const date = new Date(t.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        uniqueMonths.add(monthYear);
    });
    
    // Sort months chronologically
    const sortedMonths = Array.from(uniqueMonths).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
    });
    
    // Calculate income and expenses for each month
    sortedMonths.forEach(month => {
        months.push(month);
        
        const monthTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            return monthYear === month;
        });
        
        const monthlyIncome = monthTransactions
            .filter(t => t.category === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const monthlyExpenses = monthTransactions
            .filter(t => t.category === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        income.push(monthlyIncome);
        expenses.push(monthlyExpenses);
    });
    
    return {
        labels: months,
        income: income,
        expenses: expenses
    };
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
    
    const periodSelector = document.getElementById('period-selector');
    if (periodSelector) {
        periodSelector.addEventListener('change', updateDashboard);
    }
    
    loadTransactions();
});