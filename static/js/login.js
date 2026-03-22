import { login, logout, getCustomerOrders } from "../../backend/server.js";

function readUserProfile() {
    try {
        const raw = localStorage.getItem("userProfile");
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function nameForHeader(profile) {
    if (!profile) return "My Account";
    if (profile.name && profile.name.trim()) return profile.name.trim();
    if (profile.email && profile.email.includes("@")) return profile.email.split("@")[0];
    if (profile.email) return profile.email;
    return "My Account";
}

function setupAccountButton() {
    const accountBtn = document.querySelector("[data-account-cta]");
    if (!accountBtn) return;

    const me = readUserProfile();
    accountBtn.textContent = nameForHeader(me);
    accountBtn.setAttribute("href", "/pages/account.html");
}

function fillAccountDetails() {
    const me = readUserProfile() || {};

    const nameTag = document.getElementById("accountName");
    const emailTag = document.getElementById("accountEmail");
    const phoneTag = document.getElementById("accountPhone");

    if (nameTag) nameTag.textContent = me.name || "Not set";
    if (emailTag) emailTag.textContent = me.email || "Not set";
    if (phoneTag) phoneTag.textContent = me.phone || "Not set";
}

function fillCheckoutDefaults() {
    const me = readUserProfile() || {};

    const inputName = document.getElementById("checkoutName");
    const inputEmail = document.getElementById("checkoutEmail");
    const inputPhone = document.getElementById("checkoutPhone");

    if (inputName && me.name) inputName.value = me.name;
    if (inputEmail && me.email) inputEmail.value = me.email;
    if (inputPhone && me.phone) inputPhone.value = me.phone;
}

function moneyText(amount) {
    return `GH₵${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeText(ts) {
    if (!ts) return "Unknown time";
    return new Date(ts).toLocaleString();
}

function cleanStatus(status) {
    const valid = ["pending", "processing", "completed"];
    const lower = (status || "").toLowerCase().trim();
    return valid.includes(lower) ? lower : "pending";
}

function displayStatus(status) {
    const value = cleanStatus(status);
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusStyle(status) {
    const value = cleanStatus(status);
    if (value === "completed") return "status-pill status-completed";
    if (value === "processing") return "status-pill status-processing";
    return "status-pill status-pending";
}

function stageStyle(currentStatus, stage) {
    const stepOrder = { pending: 0, processing: 1, completed: 2 };
    const now = stepOrder[cleanStatus(currentStatus)];
    const target = stepOrder[stage];
    return target <= now ? "order-stage active" : "order-stage";
}

async function renderOrderTracker() {
    const wrapper = document.getElementById("orderTrackingList");
    if (!wrapper) return;

    const me = readUserProfile() || {};
    const myEmail = (me.email || "").trim();
    if (!myEmail) {
        wrapper.innerHTML = "<div class=\"summary-item\"><span>Add an email to your account to track orders.</span></div>";
        return;
    }

    const myOrders = await getCustomerOrders(myEmail);
    if (!myOrders.length) {
        wrapper.innerHTML = "<div class=\"summary-item\"><span>No orders yet. Your placed orders will appear here.</span></div>";
        return;
    }

    const lastOrder = localStorage.getItem("lastOrderId");

    wrapper.innerHTML = myOrders.map((order) => {
        const state = cleanStatus(order.status);
        const items = Array.isArray(order.items) ? order.items : [];
        const itemLine = items.map((item) => `${item.name || "Item"} x${Number(item.quantity || 0)}`).join(", ");
        const latestBadge = lastOrder && lastOrder === order.id
            ? "<span class=\"status-pill status-processing\">Latest</span>"
            : "";

        return `
        <article class="order-card">
          <div class="order-card-head">
            <div>
              <strong>Order #${order.id.slice(0, 8)}</strong>
              <p>${timeText(order.createdAt)}</p>
            </div>
            <div class="order-status-wrap">
              ${latestBadge}
              <span class="${statusStyle(state)}">${displayStatus(state)}</span>
            </div>
          </div>
          <div class="order-stages" aria-label="Order stage">
            <span class="${stageStyle(state, "pending")}">Pending</span>
            <span class="${stageStyle(state, "processing")}">Processing</span>
            <span class="${stageStyle(state, "completed")}">Completed</span>
          </div>
          <p><strong>Items:</strong> ${itemLine || "No items listed"}</p>
          <p><strong>Total:</strong> ${moneyText(order.total)}</p>
        </article>
        `;
    }).join("");
}

function protectPages() {
    const needsLogin = document.body?.dataset?.requiresAuth === "true";
    if (needsLogin && !localStorage.getItem("token")) {
        window.location.href = "/pages/login.html";
    }
}

window.handleLogin = async function () {
    const emailField = document.getElementById("email");
    const passField = document.getElementById("password");

    const email = emailField ? emailField.value : "";
    const password = passField ? passField.value : "";

    const loginState = await login(email, password);

    if (loginState === 1) {
        alert("Login successful");
        window.location.href = "/pages/home.html";
        return;
    }

    alert("Invalid login");
};

window.handleLogout = async function () {
    await logout();
    alert("Logout successful");
    window.location.href = "/index.html";
};

document.addEventListener("DOMContentLoaded", async function () {
    protectPages();
    setupAccountButton();
    fillAccountDetails();
    fillCheckoutDefaults();
    await renderOrderTracker();
});
