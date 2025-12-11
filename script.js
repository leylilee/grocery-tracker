// Firebase imports & setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } 
  from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


// Firebase config (same as before)
const firebaseConfig = {
  apiKey: "AIzaSyAjCIYiyTd2cnH3ucTv87sWSNPZzwoUP58",
  authDomain: "grocery-tracker-bcf2c.firebaseapp.com",
  projectId: "grocery-tracker-bcf2c",
  storageBucket: "grocery-tracker-bcf2c.firebasestorage.app",
  messagingSenderId: "1028552694531",
  appId: "1:1028552694531:web:46454f440513bd9352a736"
};

// ✅ Initialize Firebase correctly
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ------------------------
// DOM elements
// ------------------------
const loginSection = document.getElementById("login-section");
const appSection = document.getElementById("app-section");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const logoutBtn = document.getElementById("logout-btn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const greeting = document.getElementById("greeting");
const form = document.getElementById("item-form");
const tableBody = document.querySelector("#items-table tbody");
const summaryDiv = document.getElementById("summary-content");
const weeklyDiv = document.getElementById("weekly-summary");
const monthlyDiv = document.getElementById("monthly-summary");

let currentUserEmail = null;

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    appSection.style.display = "none";
    loginSection.style.display = "block";
    usernameInput.value = "";
    passwordInput.value = "";
    alert("You have been logged out.");
  } catch (err) {
    console.error("Logout error:", err);
  }
});


// Capitalize helper
function capitalize(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}


// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserEmail = user.email;
    const username = currentUserEmail.split("@")[0];
    showApp(capitalize(username));
  } else {
    appSection.style.display = "none";
    loginSection.style.display = "block";
  }
});

// LOGIN
loginBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) return alert("Enter username and password!");
  const email = `${username}@example.com`;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert("Invalid credentials. Please try again or sign up.");
  }
});

// SIGNUP
signupBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) return alert("Enter username and password!");
  const email = `${username}@example.com`;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created! You are now logged in.");
  } catch (err) {
    alert("Sign-up failed. Maybe this username is already taken.");
  }
});




// SHOW APP
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
    user: currentUserEmail // ✅ this matches the security rule
  };


  await addDoc(collection(db, "receipts"), item);
  form.reset();
  loadReceipts();
});

// ------------------------
// OCR / AI Receipt Scan
// ------------------------
const receiptImageInput = document.getElementById("receipt-image");
const scanBtn = document.getElementById("scan-btn");
const ocrResultDiv = document.getElementById("ocr-result");

scanBtn.addEventListener("click", async () => {
  const file = receiptImageInput.files[0];
  if (!file) return alert("Select a receipt image!");

  ocrResultDiv.textContent = "Scanning receipt... ⏳";

  try {
    // ------------------------
    // ✅ Simple OCR using Tesseract
    // ------------------------
    const { data: { text } } = await Tesseract.recognize(file, "eng", {
      logger: m => {
        if (m.status === 'recognizing text') {
          ocrResultDiv.textContent = `Processing: ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    ocrResultDiv.textContent = "OCR complete. Text detected:\n" + text;

    // ------------------------
    // ✅ Parse text into lines/items (simple)
    // ------------------------
    const lines = text.split("\n").map(line => line.trim()).filter(line => line);
    const items = lines.map(line => ({
      name: line,
      price: 0,       // You can extend to extract price with regex later
      category: "Unknown",
      date: new Date().toISOString().split("T")[0], // default today
      user: currentUserEmail
    }));

    // ------------------------
    // ✅ Add detected lines/items to Firestore
    // ------------------------
    for (const item of items) {
      await addDoc(collection(db, "receipts"), item);
    }

    // ------------------------
    // ✅ Update UI
    // ------------------------
    alert(`${items.length} lines/items added!`);
    receiptImageInput.value = "";
    ocrResultDiv.textContent = "Scan complete ✅";

    loadReceipts();

  } catch (err) {
    console.error(err);
    ocrResultDiv.textContent = "Error scanning receipt!";
  }
});


// ------------------------
// LOAD RECEIPTS
// ------------------------
async function loadReceipts() {
  const q = query(collection(db, "receipts"), where("user", "==", currentUserEmail));
  const snapshot = await getDocs(q);

  const receipts = [];
  snapshot.forEach(d => {
    receipts.push({
      id: d.id,       // include Firebase document id
      ...d.data()
    });
  });

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
      <td class="actions">
        <button class="menu-btn">⋮</button>
        <div class="menu">
          <div class="edit-option" data-id="${item.id}">Edit</div>
          <div class="delete-option" data-id="${item.id}">Delete</div>
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

// --- Table click listener ---
tableBody.addEventListener("click", async (e) => {
  const row = e.target.closest("tr");
  if (!row) return;

  const menu = row.querySelector(".menu");

  if (e.target.classList.contains("menu-btn")) {
    menu.classList.toggle("show");
    return;
  }

  if (e.target.classList.contains("edit-option")) {
    const id = e.target.dataset.id;
    const item = {
      name: row.children[1].textContent,
      category: row.children[2].textContent,
      price: parseFloat(row.children[3].textContent),
      date: row.children[0].textContent
    };
    await editItem(id, item);
    menu.classList.remove("show");
    return;
  }

  if (e.target.classList.contains("delete-option")) {
    const id = e.target.dataset.id;
    await deleteItem(id);
    menu.classList.remove("show");
    return;
  }
});

// --- Close menus when clicking outside ---
document.addEventListener("click", (e) => {
  if (!e.target.closest(".menu") && !e.target.classList.contains("menu-btn")) {
    document.querySelectorAll(".menu").forEach(m => m.classList.remove("show"));
  }
});

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

async function deleteItem(id) {
  if (!confirm("Delete this item?")) return;
  await deleteDoc(doc(db, "receipts", id));
  loadReceipts();
}

async function editItem(id, item) {
  const newName = prompt("Edit item name:", item.name);
  if (newName === null) return;

  const newPrice = prompt("Edit price:", item.price);
  if (newPrice === null) return;

  const newCategory = prompt("Edit category:", item.category);
  if (newCategory === null) return;

  const newDate = prompt("Edit date (YYYY-MM-DD):", item.date);
  if (newDate === null) return;

  await updateDoc(doc(db, "receipts", id), {
    name: newName,
    price: parseFloat(newPrice),
    category: newCategory,
    date: newDate
  });

  loadReceipts();
}
