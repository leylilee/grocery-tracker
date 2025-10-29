// ------------------------
// Firebase references
// ------------------------
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } 
  from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

// ------------------------
// DOM elements
// ------------------------
const loginSection = document.getElementById("login-section");
const appSection = document.getElementById("app-section");
const loginBtn = document.getElementById("login-btn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const greeting = document.getElementById("greeting");

const form = document.getElementById("item-form");
const tableBody = document.querySelector("#items-table tbody");
const summaryDiv = document.getElementById("summary-content");
const weeklyDiv = document.getElementById("weekly-summary");
const monthlyDiv = document.getElementById("monthly-summary");

let currentUserEmail = null;

// ------------------------
// AUTH & LOGIN
// ------------------------
loginBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) return alert("Enter username and password!");

  // convert username to fake email
  const email = `${username}@example.com`;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    // if user does not exist, create it
    await createUserWithEmailAndPassword(auth, email, password);
  }
});

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserEmail = user.email;
    showApp(currentUserEmail.split("@")[0]); // username part
  }
});

function showApp(username) {
  loginSection.style.display = "none";
  appSection.style.display = "block";
  greeting.textContent = `Hi, ${username}!`;
  loadReceipts();
}

// ------------------------
// ADD RECEIPT
// ------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const item = {
    date: document.getElementById("date").value,
    name: document.getElementById("item").value,
    category: document.getElementById("category").value,
    price: parseFloat(document.getElementById("price").value),
    user: currentUserEmail
  };

  await addDoc(collection(db, "receipts"), item);
  form.reset();
  loadReceipts();
});

// ------------------------
// LOAD RECEIPTS
// ------------------------
async function loadReceipts() {
  const q = query(collection(db, "receipts"), where("user", "==", currentUserEmail));
  const snapshot = await getDocs(q);

  const receipts = [];
  snapshot.forEach(doc => receipts.push(doc.data()));

  renderTable(receipts);
  renderSummaries(receipts);
}

// ------------------------
// TABLE RENDERING
// ------------------------
function renderTable(receipts) {
  tableBody.innerHTML = "";
  receipts.forEach(item => {
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

// ------------------------
// SUMMARIES
// ------------------------
function renderSummaries(receipts) {
  renderCategorySummary(receipts);
  renderWeeklySummary(receipts);
  renderMonthlySummary(receipts);
}

function renderCategorySummary(receipts) {
  const byCategory = {};
  let total = 0;
  receipts.forEach(item => {
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

function renderWeeklySummary(receipts) {
  const byWeek = {};
  receipts.forEach(item => {
    const date = new Date(item.date);
    const weekStart = getWeekStart(date);
    const key = `${weekStart.toLocaleDateString()} - ${new Date(weekStart.getTime() + 6*86400000).toLocaleDateString()}`;
    byWeek[key] = (byWeek[key] || 0) + item.price;
  });

  let html = "<h3>By Week:</h3><ul>";
  for (const [week, val] of Object.entries(byWeek)) {
    html += `<li><strong>${week}:</strong> $${val.toFixed(2)}</li>`;
  }
  html += "</ul>";
  weeklyDiv.innerHTML = html;
}

function renderMonthlySummary(receipts) {
  const byMonth = {};
  receipts.forEach(item => {
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

// ------------------------
// HELPER FUNCTION: Week start
// ------------------------
function getWeekStart(date) {
  const day = date.getDay(); // Sunday = 0
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  return new Date(date.setDate(diff));
}
