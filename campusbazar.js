const CATS = {
  clothes: ["👕 Clothes", "Find new and pre-loved clothes from students."],
  notes: ["📚 Notes & Books", "Share and discover books and study materials."],
  jewellery: ["💎 Jewellery & Accessories", "Handmade jewellery and accessories from campus creators."],
  food: ["🍰 Homemade Food", "Homemade food, snacks and treats made by students."],
  used: ["♻️ Used Things", "Give useful second-hand things a new home."],
  swap: ["🔄 Swap Corner", "Exchange something you have for something you need."]
};

const CAT_TEXT = {
  clothes: ["Clothes", "New & pre-loved"],
  notes: ["Notes", "Books & study materials"],
  jewellery: ["Jewellery", "Handmade & accessories"],
  food: ["Food", "Homemade & snacks"],
  used: ["Used Things", "Give things a second life"],
  swap: ["Swap", "Exchange instead of buying"]
};

let products = JSON.parse(localStorage.getItem("campusProducts")) || [];
let orders = JSON.parse(localStorage.getItem("campusOrders")) || [];
let notifications = JSON.parse(localStorage.getItem("campusNotifications")) || [];
let needs = JSON.parse(localStorage.getItem("campusNeeds")) || [];
let currentCategory = "";
let previousPage = "home";

const $ = id => document.getElementById(id);
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

const pages = ["homePage", "categoryPage", "categoriesPage", "sellPage", "productPage", "searchPage", "ordersPage", "sellerOrdersPage", "reportPage", "needBoardPage"];

function hideAllPages() {
  pages.forEach(id => $(id)?.classList.add("hidden"));
}

function showPage(p) {
  hideAllPages();
  const map = { home: "homePage", categories: "categoriesPage", sell: "sellPage", orders: "ordersPage", sellerOrders: "sellerOrdersPage", report: "reportPage", needBoard: "needBoardPage" };
  const page = $(map[p]);
  if (page) page.classList.remove("hidden");

  if (p === "home") showLatestProducts();
  if (p === "orders") showMyOrders();
  if (p === "sellerOrders") showSellerOrders();
  if (p === "needBoard") renderNeeds();

  previousPage = p;
  scrollTo(0, 0);
}

function categoryCards() {
  return Object.keys(CAT_TEXT).map(c => {
    const [name, desc] = CAT_TEXT[c];
    return `
      <div class="category-card" onclick="openCategory('${c}')">
        <div class="category-icon ${c}">${CATS[c][0].split(" ")[0]}</div>
        <h3>${name}</h3>
        <p>${desc}</p>
      </div>`;
  }).join("");
}

function openCategory(c) {
  currentCategory = c;
  hideAllPages();
  $("categoryPage").classList.remove("hidden");
  $("categoryTitle").textContent = CATS[c][0];
  $("categoryLabel").textContent = c.toUpperCase();
  $("categoryDescription").textContent = CATS[c][1];
  $("categorySearch").value = "";
  showCategoryProducts(c);
  previousPage = "category";
  scrollTo(0, 0);
}

function showCategoryProducts(c) {
  renderProducts(products.filter(p => p.category === c), $("categoryProducts"), $("categoryEmpty"));
}

function filterCategoryProducts() {
  const q = $("categorySearch").value.toLowerCase();
  renderProducts(
    products.filter(p => p.category === currentCategory && (p.name + " " + p.details).toLowerCase().includes(q)),
    $("categoryProducts"), $("categoryEmpty"), "No matching products"
  );
}

function renderProducts(list, box, empty, msg = "No products here yet") {
  if (!box || !empty) return;
  box.innerHTML = list.map(p => createProductCard(p, products.indexOf(p))).join("");
  empty.classList.toggle("hidden", list.length > 0);
  if (!empty.classList.contains("hidden")) {
    const title = empty.querySelector("h3");
    if (title) title.textContent = msg;
  }
}

function createProductCard(p, i) {
  return `
    <div class="product-card" onclick="openProduct(${i})">
      <img class="product-image" src="${p.image}" alt="${p.name}">
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <h3>${p.name}</h3>
        <p class="product-description">${p.details}</p>
        <div class="product-bottom">
          <div class="product-price">৳${p.price}</div>
          <div class="product-quantity">${p.quantity} available</div>
        </div>
        <button class="view-button" onclick="event.stopPropagation(); openProduct(${i})">View Details</button>
      </div>
    </div>`;
}

function showLatestProducts() {
  renderProducts(products.slice(-8).reverse(), $("latestProducts"), $("noLatest"), "No listings yet");
}

function showAllCategories() {
  $("homeCategories").innerHTML = categoryCards();
  $("allCategories").innerHTML = categoryCards();
}

function openProduct(i) {
  previousPage = "category";
  hideAllPages();
  $("productPage").classList.remove("hidden");
  const p = products[i];
  if (!p) {
    $("productDetail").innerHTML = "<h2>Product not found.</h2>";
    return;
  }
  $("productDetail").innerHTML = `
    <img class="detail-image" src="${p.image}" alt="${p.name}">
    <div class="detail-content">
      <div class="product-category">${p.category}</div>
      <h1>${p.name}</h1>
      <div class="detail-price">৳${p.price}</div>
      <div class="detail-line"><b>Available quantity:</b> ${p.quantity}</div>
      <div class="detail-line"><b>Product details</b><br><br>${p.details}</div>
      <div class="detail-line"><b>Delivery information</b><br><br>${p.delivery}</div>
      <div class="detail-line"><b>Campus marketplace</b><br><br>This listing is intended for campus-based exchange.</div>
      <button class="contact-button" onclick="buyProduct(${i})">🛒 Buy / Request Product</button>
      <button class="view-button" onclick="showPage('report')">Report an issue</button>
    </div>`;
  scrollTo(0, 0);
}

function goBackFromProduct() {
  previousPage === "category" ? openCategory(currentCategory) : showPage("home");
}

function addProduct(e) {
  e.preventDefault();
  const file = $("productImage").files[0];
  if (!file) return showToast("Please upload a product picture.");

  const p = {
    id: Date.now(),
    name: $("productName").value.trim(),
    category: $("productCategory").value,
    price: $("productPrice").value,
    quantity: $("productQuantity").value,
    details: $("productDetails").value.trim(),
    delivery: $("productDelivery").value.trim(),
    image: "",
    date: new Date().toLocaleDateString()
  };

  const reader = new FileReader();
  reader.onload = () => {
    p.image = reader.result;
    products.push(p);
    save("campusProducts", products);
    notifications.unshift({ message: `${p.name} was just added to ${p.category}.`, date: new Date().toLocaleTimeString(), read: false });
    save("campusNotifications", notifications);
    updateNotificationCount();
    $("productForm").reset();
    $("imagePreview").classList.add("hidden");
    showToast("Product published successfully!");
    setTimeout(() => openCategory(p.category), 900);
  };
  reader.readAsDataURL(file);
}

function previewImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    $("preview").src = r.result;
    $("imagePreview").classList.remove("hidden");
  };
  r.readAsDataURL(file);
}

function searchProducts() {
  const q = $("searchInput").value.trim().toLowerCase();
  if (!q) return showToast("Type a product name to search.");

  hideAllPages();
  $("searchPage").classList.remove("hidden");
  $("searchTitle").textContent = `Results for "${q}"`;
  renderProducts(
    products.filter(p => (p.name + " " + p.category + " " + p.details).toLowerCase().includes(q)),
    $("searchResults"), $("searchEmpty"), "No matching products"
  );
  scrollTo(0, 0);
}

document.addEventListener("keydown", e => {
  if (e.key === "Enter" && document.activeElement.id === "searchInput") searchProducts();
});

function buyProduct(i) {
  const p = products[i];
  if (!p) return showToast("Product not found.");
  if (Number(p.quantity) <= 0) return showToast("This product is out of stock.");

  const name = prompt("Enter your name:");
  if (!name) return;
  const studentId = prompt("Enter your Student ID:");
  if (!studentId) return;
  const phone = prompt("Enter your phone number:");
  if (!phone) return;
  const quantity = Number(prompt(`How many do you want? Available: ${p.quantity}`));
  if (!quantity || quantity < 1 || quantity > Number(p.quantity)) return showToast("Invalid quantity.");
  const delivery = prompt("Pickup / Delivery information:");
  if (!delivery) return;

  const order = {
    id: "ORD-" + Date.now(),
    productId: p.id,
    productName: p.name,
    sellerProductIndex: i,
    buyerName: name,
    studentId, phone, quantity,
    price: Number(p.price),
    total: Number(p.price) * quantity,
    delivery, status: "Pending",
    date: new Date().toLocaleString()
  };

  orders.unshift(order);
  save("campusOrders", orders);
  p.quantity = Number(p.quantity) - quantity;
  save("campusProducts", products);

  notifications.unshift({ message: `New order for ${p.name} from ${name}.`, date: new Date().toLocaleTimeString(), read: false });
  save("campusNotifications", notifications);
  updateNotificationCount();
  showToast("Order placed successfully!");
  setTimeout(() => showPage("orders"), 800);
}

const statusClass = s => ({ Pending: "status-pending", Confirmed: "status-confirmed", Ready: "status-ready", Completed: "status-completed" }[s] || "");
const statusIcon = s => ({ Pending: "🟡", Confirmed: "🟢", Ready: "🔵", Completed: "✅" }[s] || "📦");

function orderHeader(o) {
  return `
    <div class="order-top">
      <div>
        <h3>${o.productName}</h3>
        <div class="order-id">${o.id}</div>
      </div>
      <span class="order-status ${statusClass(o.status)}">${statusIcon(o.status)} ${o.status}</span>
    </div>`;
}

function showMyOrders() {
  $("myOrders").innerHTML = orders.map(o => `
    <div class="order-card">
      ${orderHeader(o)}
      <div class="order-info">
        <p><b>Buyer:</b><br>${o.buyerName}</p>
        <p><b>Quantity:</b><br>${o.quantity}</p>
        <p><b>Phone:</b><br>${o.phone}</p>
        <p><b>Pickup / Delivery:</b><br>${o.delivery}</p>
      </div>
      <div class="order-total">Total: ৳${o.total}</div>
      <div class="order-id">Ordered: ${o.date}</div>
    </div>`).join("");
  $("noOrders").classList.toggle("hidden", orders.length > 0);
}

function sellerButtons(i) {
  const s = orders[i].status;
  if (s === "Pending") return `<button onclick="updateOrderStatus(${i}, 'Confirmed')">✓ Accept Order</button>`;
  if (s === "Confirmed") return `<button onclick="updateOrderStatus(${i}, 'Ready')">📦 Ready for Pickup</button>`;
  if (s === "Ready") return `<button onclick="updateOrderStatus(${i}, 'Completed')">✓ Mark Completed</button>`;
  return `<span>Order completed successfully.</span>`;
}

function showSellerOrders() {
  $("sellerOrders").innerHTML = orders.map((o, i) => `
    <div class="order-card">
      ${orderHeader(o)}
      <div class="order-info">
        <p><b>Customer:</b><br>${o.buyerName}</p>
        <p><b>Student ID:</b><br>${o.studentId}</p>
        <p><b>Phone:</b><br>${o.phone}</p>
        <p><b>Quantity:</b><br>${o.quantity}</p>
        <p><b>Delivery:</b><br>${o.delivery}</p>
        <p><b>Total:</b><br>৳${o.total}</p>
      </div>
      <div class="order-actions">${sellerButtons(i)}</div>
    </div>`).join("");
  $("noSellerOrders").classList.toggle("hidden", orders.length > 0);
}

function updateOrderStatus(i, s) {
  orders[i].status = s;
  save("campusOrders", orders);
  showSellerOrders();
  showToast("Order status updated.");
}

function submitReport(e) {
  e.preventDefault();
  const reports = JSON.parse(localStorage.getItem("campusReports")) || [];
  reports.push({ target: $("reportTarget").value, type: $("reportType").value, message: $("reportMessage").value, date: new Date().toLocaleString() });
  save("campusReports", reports);
  e.target.reset();
  showToast("Report submitted to campus authority.");
}

function updateNotificationCount() {
  const unreadCount = notifications.filter(n => !n.read).length;
  const count = $("notificationCount");
  if (!count) return;
  count.textContent = unreadCount;
  count.style.display = unreadCount > 0 ? "flex" : "none";
}

function showNotifications() {
  const panel = $("notificationPanel");
  if (!panel) return;
  panel.classList.remove("hidden");
  const list = $("notificationList");
  if (!list) return;

  list.innerHTML = notifications.length > 0
    ? notifications.map(n => `<div class="notification-item"><div>🔔</div><div>${n.message}<small>${n.date}</small></div></div>`).join("")
    : `<div class="notification-item"><div>🔔</div><div>No new notifications.</div></div>`;

  notifications = notifications.map(n => ({ ...n, read: true }));
  save("campusNotifications", notifications);
  updateNotificationCount();
}

function closeNotifications() {
  $("notificationPanel").classList.add("hidden");
}

function addNeed(e) {
  e.preventDefault();
  const phone = $("needPhone").value.trim();
  if (!/^[0-9]{11}$/.test(phone)) return showToast("Please enter a valid 11-digit phone number.");

  const need = {
    id: "NEED-" + Date.now(),
    name: $("needName").value.trim(),
    category: $("needCategory").value,
    budget: Number($("needBudget").value),
    phone, details: $("needDetails").value.trim(),
    date: new Date().toLocaleString()
  };

  needs.unshift(need);
  save("campusNeeds", needs);
  notifications.unshift({ message: `New need posted: ${need.name}`, date: new Date().toLocaleTimeString(), read: false });
  save("campusNotifications", notifications);

  updateNotificationCount();
  updateNeedCount();
  $("needForm").reset();
  renderNeeds();
  showToast("Your need was posted successfully!");
}

function updateNeedCount() {
  const count = $("needCount");
  if (count) count.textContent = needs.length;
}

function renderNeeds() {
  const list = $("needList");
  const empty = $("needEmpty");
  if (!list || !empty) return;

  updateNeedCount();
  if (needs.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  list.innerHTML = needs.map((need, index) => `
    <div class="order-card need-card">
      <div class="order-top">
        <div>
          <div class="product-category">${CATS[need.category] ? CATS[need.category][0] : need.category}</div>
          <h3>${need.name}</h3>
        </div>
        <div class="order-total">Budget: ৳${need.budget}</div>
      </div>
      <div class="order-info">
        <p><b>Details:</b><br>${need.details}</p>
        <p><b>📞 Contact:</b><br>${need.phone}</p>
        <p><b>Posted:</b><br>${need.date}</p>
      </div>
      <div class="order-actions" style="margin-top:15px;">
        <button class="delete-btn" onclick="deleteNeed(${index})">🗑️ Delete Request</button>
      </div>
    </div>`).join("");
}

function deleteNeed(index) {
  if (confirm("Have you fulfilled this need? Click OK to remove this post.")) {
    needs.splice(index, 1);
    save("campusNeeds", needs);
    renderNeeds();
    showToast("Need post deleted successfully!");
  }
}

function showToast(message) {
  const t = $("toast");
  if (!t) return;
  t.textContent = message;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

showAllCategories();
showLatestProducts();
renderNeeds();
updateNeedCount();
updateNotificationCount();
