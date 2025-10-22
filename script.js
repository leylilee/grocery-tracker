const form = document.getElementById("item-form");
const tableBody = document.querySelector("#items-table tbody");
const summaryDiv = document.getElementById("summary-content");

let items = JSON.parse(localStorage.getItem("groceryItems")) || [];

function saveItems() {
  localStorage.setItem("groceryItems", JSON.stringify(items));
}

function renderTable() {
  tableBody.innerHTML = "";
  items.forEach(item => {
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

function renderSummary() {
  const byCategory = {};
  let total = 0;

  items.forEach(item => {
    byCategory[item.category] = (byCategory[item.category] || 0) + item.price;
    total += item.price;
  });

  let html = "<ul>";
  for (const [cat, val] of Object.entries(byCategory)) {
    html += `<li><strong>${cat}:</strong> $${val.toFixed(2)}</li>`;
  }
  html += `</ul><p><strong>Total:</strong> $${total.toFixed(2)}</p>`;

  summaryDiv.innerHTML = html;
}

form.addEventListener("submit", e => {
  e.preventDefault();

  const newItem = {
    date: document.getElementById("date").value,
    name: document.getElementById("item").value,
    category: document.getElementById("category").value,
    price: parseFloat(document.getElementById("price").value)
  };

  items.push(newItem);
  saveItems();
  renderTable();
  renderSummary();

  form.reset();
});

renderTable();
renderSummary();
