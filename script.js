let invoices = JSON.parse(localStorage.getItem("invoices")) || [];
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

function money(value) {
  return "$" + Number(value).toFixed(2);
}

function saveData() {
  localStorage.setItem("invoices", JSON.stringify(invoices));
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function generateInvoiceNumber() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const datePart = `${yyyy}-${mm}-${dd}`;

  const todaysInvoices = invoices.filter(i =>
    i.invoiceNumber && i.invoiceNumber.includes(datePart)
  );

  const count = String(todaysInvoices.length + 1).padStart(3, "0");

  return `INV-${datePart}-${count}`;
}

function createInvoice() {
  const businessName = document.getElementById("businessName").value;
  const clientName = document.getElementById("clientName").value;
  const serviceName = document.getElementById("serviceName").value;
  const amount = Number(document.getElementById("amount").value);
  const invoiceDate = document.getElementById("invoiceDate").value;
  const dueDate = document.getElementById("dueDate").value;

  if (!businessName || !clientName || !serviceName || !amount || !invoiceDate) {
    alert("Please fill out required fields.");
    return;
  }

  const hst = amount * 0.13;
  const total = amount + hst;

  invoices.push({
    id: Date.now(),
    invoiceNumber: generateInvoiceNumber(),
    businessName,
    clientName,
    serviceName,
    amount,
    hst,
    total,
    invoiceDate,
    dueDate,
    paid: false
  });

  clearInvoiceForm();
  saveData();
  render();
}

function addExpense() {
  const name = document.getElementById("expenseName").value;
  const amount = Number(document.getElementById("expenseAmount").value);
  const hstType = document.getElementById("expenseHstType").value;
  const customHst = Number(document.getElementById("expenseHst").value) || 0;

  if (!name || !amount) {
    alert("Please fill out expense fields.");
    return;
  }

  let hstPaid = 0;

  if (hstType === "auto") hstPaid = amount * 0.13;
  if (hstType === "custom") hstPaid = customHst;

  expenses.push({
    id: Date.now(),
    name,
    amount,
    hstPaid
  });

  clearExpenseForm();
  saveData();
  render();
}

function clearInvoiceForm() {
  document.getElementById("clientName").value = "";
  document.getElementById("serviceName").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("invoiceDate").value = "";
  document.getElementById("dueDate").value = "";
}

function clearExpenseForm() {
  document.getElementById("expenseName").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseHstType").value = "none";
  document.getElementById("expenseHst").value = "";
}

function togglePaid(id) {
  invoices = invoices.map(i => {
    if (i.id === id) i.paid = !i.paid;
    return i;
  });

  saveData();
  render();
}

function deleteInvoice(id) {
  invoices = invoices.filter(i => i.id !== id);
  saveData();
  render();
}

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveData();
  render();
}

function renderInvoices() {
  const el = document.getElementById("invoiceList");
  el.innerHTML = "";

  invoices.forEach(i => {
    el.innerHTML += `
      <div class="item">
        <strong>${i.invoiceNumber}</strong>
        <p>Business: ${i.businessName}</p>
        <p>Client: ${i.clientName}</p>
        <p>Service: ${i.serviceName}</p>
        <p>Date: ${i.invoiceDate}</p>
        <p>Due: ${i.dueDate || "N/A"}</p>
        <p>Subtotal: ${money(i.amount)}</p>
        <p>HST: ${money(i.hst)}</p>
        <p>Total: ${money(i.total)}</p>
        <p class="${i.paid ? "paid" : "unpaid"}">${i.paid ? "Paid" : "Unpaid"}</p>

        <button onclick="togglePaid(${i.id})">Toggle Paid</button>
        <button class="pdf" onclick="downloadInvoicePDF(${i.id})">Download PDF</button>
        <button class="delete" onclick="deleteInvoice(${i.id})">Delete</button>
      </div>
    `;
  });
}

function renderExpenses() {
  const el = document.getElementById("expenseList");
  el.innerHTML = "";

  expenses.forEach(e => {
    el.innerHTML += `
      <div class="item">
        <strong>${e.name}</strong>
        <p>Expense: ${money(e.amount)}</p>
        <p>HST Paid: ${money(e.hstPaid)}</p>
        <p>Total: ${money(e.amount + e.hstPaid)}</p>
        <button class="delete" onclick="deleteExpense(${e.id})">Delete</button>
      </div>
    `;
  });
}

function renderDashboard() {
  const income = invoices.reduce((s, i) => s + i.amount, 0);
  const hstCollected = invoices.reduce((s, i) => s + i.hst, 0);
  const expensesTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const hstPaid = expenses.reduce((s, e) => s + e.hstPaid, 0);

  const netHst = hstCollected - hstPaid;
  const profit = income - expensesTotal;

  document.getElementById("totalIncome").textContent = money(income);
  document.getElementById("totalHst").textContent = money(hstCollected);
  document.getElementById("totalExpenses").textContent = money(expensesTotal);
  document.getElementById("totalProfit").textContent = money(profit);
  document.getElementById("hstPaidBox").textContent = money(hstPaid);
  document.getElementById("netHstBox").textContent = money(netHst);
}

function downloadInvoicePDF(id) {
  const invoice = invoices.find(i => i.id === id);
  if (!invoice) return;

  if (!window.jspdf) {
    alert("PDF library not loaded. Make sure you are connected to the internet.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  function buildPDF(hasLogo, logo) {
    if (hasLogo) {
      doc.addImage(logo, "JPEG", 20, 12, 80, 38);
    } else {
      doc.setFontSize(18);
      doc.text(invoice.businessName || "Christina Patricia", 20, 25);
    }

    doc.setFontSize(26);
    doc.text("INVOICE", 145, 25);

    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 145, 38);
    doc.text(`Date: ${invoice.invoiceDate}`, 145, 45);
    doc.text(`Due: ${invoice.dueDate || "N/A"}`, 145, 52);
    doc.text(`Status: ${invoice.paid ? "Paid" : "Unpaid"}`, 145, 59);

    doc.line(20, 72, 190, 72);

    doc.setFontSize(13);
    doc.text("From", 20, 88);

    doc.setFontSize(11);
    doc.text(invoice.businessName || "Christina Patricia", 20, 98);
    doc.text("HST #787689751", 20, 106);
    doc.text("395 Dundas Street West", 20, 114);
    doc.text("Oakville, ON L6M 5R8", 20, 122);
    doc.text("(437)-224-2425", 20, 130);

    doc.setFontSize(13);
    doc.text("Bill To", 120, 88);

    doc.setFontSize(11);
    doc.text(invoice.clientName, 120, 98);

    doc.line(20, 145, 190, 145);

    doc.setFontSize(12);
    doc.text("Description", 20, 158);
    doc.text("Amount", 160, 158);

    doc.line(20, 164, 190, 164);

    doc.setFontSize(11);
    doc.text(invoice.serviceName, 20, 176);
    doc.text(money(invoice.amount), 160, 176);

    doc.line(20, 192, 190, 192);

    doc.text("Subtotal:", 125, 208);
    doc.text(money(invoice.amount), 160, 208);

    doc.text("HST 13%:", 125, 218);
    doc.text(money(invoice.hst), 160, 218);

    doc.setFontSize(14);
    doc.text("Total:", 125, 234);
    doc.text(money(invoice.total), 160, 234);

    doc.setFontSize(10);
    doc.text("Thank you for your business.", 20, 260);
    doc.text("Please keep this invoice for your records.", 20, 268);

    const safeClientName = invoice.clientName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    doc.save(`${invoice.invoiceNumber}-${safeClientName}.pdf`);
  }

  const logo = new Image();
  logo.src = "logo.jpeg";

  logo.onload = function () {
    buildPDF(true, logo);
  };

  logo.onerror = function () {
    buildPDF(false, null);
  };
}

function downloadBackup() {
  const backup = {
    app: "SoloBooks",
    createdAt: new Date().toISOString(),
    invoices,
    expenses
  };

  const data = JSON.stringify(backup, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "solobooks-backup-" + new Date().toISOString().split("T")[0] + ".json";
  link.click();

  URL.revokeObjectURL(url);
}

function restoreBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const backup = JSON.parse(e.target.result);

      invoices = backup.invoices || [];
      expenses = backup.expenses || [];

      saveData();
      render();

      alert("Backup restored successfully.");
    } catch {
      alert("Invalid backup file.");
    }
  };

  reader.readAsText(file);
}

function downloadCSV(filename, rows) {
  const processRow = row =>
    row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");

  const csvContent = rows.map(processRow).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function downloadInvoicesCSV() {
  const rows = [
    ["Invoice #", "Business", "Client", "Service", "Date", "Due Date", "Subtotal", "HST Collected", "Total", "Status"]
  ];

  invoices.forEach(i => {
    rows.push([
      i.invoiceNumber,
      i.businessName || "",
      i.clientName,
      i.serviceName,
      i.invoiceDate,
      i.dueDate || "",
      i.amount,
      i.hst,
      i.total,
      i.paid ? "Paid" : "Unpaid"
    ]);
  });

  downloadCSV("invoices.csv", rows);
}

function downloadExpensesCSV() {
  const rows = [["Expense Name", "Amount Before HST", "HST Paid", "Total"]];

  expenses.forEach(e => {
    rows.push([e.name, e.amount, e.hstPaid, e.amount + e.hstPaid]);
  });

  downloadCSV("expenses.csv", rows);
}

function downloadSummaryCSV() {
  const incomeBeforeHst = invoices.reduce((s, i) => s + i.amount, 0);
  const hstCollected = invoices.reduce((s, i) => s + i.hst, 0);
  const expensesBeforeHst = expenses.reduce((s, e) => s + e.amount, 0);
  const hstPaid = expenses.reduce((s, e) => s + e.hstPaid, 0);

  const netHst = hstCollected - hstPaid;
  const profit = incomeBeforeHst - expensesBeforeHst;

  const rows = [
    ["Metric", "Amount"],
    ["Sales Before HST", incomeBeforeHst],
    ["HST Collected", hstCollected],
    ["Expenses Before HST", expensesBeforeHst],
    ["HST Paid", hstPaid],
    ["Net HST Owed", netHst],
    ["Profit Before Tax", profit]
  ];

  downloadCSV("summary.csv", rows);
}

function render() {
  renderDashboard();
  renderInvoices();
  renderExpenses();
}

render();