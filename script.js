const loginSection = document.getElementById("login-section");
const appSection = document.getElementById("app-section");
const loginBtn = document.getElementById("login-btn");
const usernameInput = document.getElementById("username");
const greeting = document.getElementById("greeting");

const form = document.getElementById("item-form");
const tableBody = document.querySelector("#items-table tbody");
const summaryDiv = document.getElementById("summary-content");
const weeklyDiv = document.getElementById("weekly-summary");
const monthlyDiv = document.getElementById("monthly-summary");

let currentUser = localStorage.getItem("currentUser");
let users = JSON.parse(localStorage.getItem("users")) || {}; // each user has their own data

// --- LOGIN LOGIC ---
if (currentUser && users[currentUser]) {
  showApp(currentUser);
}

loginBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Enter your name first!");

  if (!users[name]) users[name] = [];
  localStorage.setItem("currentUser", name);
  localStorage.setItem("users", JSON.stringify(users));

  showApp(name);
});

function showApp(name) {
  loginSection.style.display = "none";
  appSection.style.display = "block";
  greeting.textContent = `Hi, ${name}!`;
  currentUser = name;
  renderTable();
  renderSummaries();
}

// --- ITEM ADDING LOGIC ---
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const newItem = {
    date: document.getElementById("date").value,
    name: document.getElementById("item").value,
    category: document.getElementById("category").value,
    price: parseFloat(document.getElementById("price").value)
  };

  users[currentUser].push(newItem);
  localStorage.setItem("users", JSON.stringify(users));

  renderTable();
  renderSummaries();
  form.reset();
});

// --- TABLE DISPLAY ---
function renderTable() {
  tableBody.innerHTML = "";
  users[currentUser].forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.date}</td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.price.toFixed(2)}</td>
    `;
    tableBody.appendChild(row);
  });
}

// --- SUMMARY FUNCTIONS ---
function renderSummaries() {
  renderCategorySummary();
  renderWeeklySummary();
  renderMonthlySummary();
}

function renderCategorySummary() {
  const byCategory = {};
  let total = 0;
  users[currentUser].forEach(item => {
    byCategory[item.category] = (byCategory[item.category] || 0) + item.price;
    total += item.price;
  });

  let html = "<h3>By Category:</h3><ul>";
  for (const [cat, val] of Object.entries(byCategory)) {
    html += `<li><strong>${cat}:</strong> $${val.toFixed(2)}</li>`;
  }
  html += `</ul><p><strong>Total:</strong> $${total.toFixed(2)}</p>`;
  summaryDiv.innerHTML = html;
}

function renderWeeklySummary() {
  const byWeek = {};
  users[currentUser].forEach(item => {
    const date = new Date(item.date);
    const weekStart = getWeekStart(date);
    const key = `${weekStart.toLocaleDateString()} - ${new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString()}`;
    byWeek[key] = (byWeek[key] || 0) + item.price;
  });

  let html = "<h3>By Week:</h3><ul>";
  for (const [week, val] of Object.entries(byWeek)) {
    html += `<li><strong>${week}:</strong> $${val.toFixed(2)}</li>`;
  }
  html += "</ul>";
  weeklyDiv.innerHTML = html;
}

function renderMonthlySummary() {
  const byMonth = {};
  users[currentUser].forEach(item => {
    const date = new Date(item.date);
    const key = date.toLocaleString("default", { month: "long", year: "numeric" });
    byMonth[key] = (byMonth[key] || 0) + item.price;
  });

  let html = "<h3>By Month:</h3><ul>";
  for (const [month, val] of Object.entries(byMonth)) {
    html += `<li><strong>${month}:</strong> $${val.toFixed(2)}</li>`;
  }
  html += "</ul>";
  monthlyDiv.innerHTML = html;
}

function getWeekStart(date) {
  const day = date.getDay(); // 0 = Sunday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day of week
  return new Date(date.setDate(diff));
}
