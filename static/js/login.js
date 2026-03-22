import { login, logout, getCustomerOrders } from "../../backend/server.js";

function getProfile() {
    try {
        const raw = localStorage.getItem("userProfile");
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function getDisplayName(profile) {
    if (!profile) return "My Account";
    if (profile.name && profile.name.trim()) return profile.name.trim();
    if (profile.email && profile.email.includes("@")) return profile.email.split("@")[0];
    if (profile.email) return profile.email;
    return "My Account";
}

function bindAccountCTA() {
    const accountCta = document.querySelector("[data-account-cta]");
    if (!accountCta) return;

    const profile = getProfile();
    accountCta.textContent = getDisplayName(profile);
    accountCta.setAttribute("href", "/pages/account.html");
}

function bindAccountPageDetails() {
    const profile = getProfile() || {};

    const nameEl = document.getElementById("accountName");
    const emailEl = document.getElementById("accountEmail");
    const phoneEl = document.getElementById("accountPhone");

    if (nameEl) nameEl.textContent = profile.name || "Not set";
    if (emailEl) emailEl.textContent = profile.email || "Not set";
    if (phoneEl) phoneEl.textContent = profile.phone || "Not set";
}

function bindCheckoutDetails() {
    const profile = getProfile() || {};

    const nameInput = document.getElementById("checkoutName");
    const emailInput = document.getElementById("checkoutEmail");
    const phoneInput = document.getElementById("checkoutPhone");

    if (nameInput && profile.name) nameInput.value = profile.name;
    if (emailInput && profile.email) emailInput.value = profile.email;
    if (phoneInput && profile.phone) phoneInput.value = profile.phone;
}

function formatPrice(amount) {
    return `GH₵${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(timestamp) {
    if (!timestamp) return "Unknown time";
    return new Date(timestamp).toLocaleString();
}

function normalizeStatus(status) {
    const allowed = ["pending", "processing", "completed"];
    const cleanStatus = (status || "").toLowerCase().trim();
    return allowed.includes(cleanStatus) ? cleanStatus : "pending";
}

function toStatusLabel(status) {
    const cleanStatus = normalizeStatus(status);
    return cleanStatus.charAt(0).toUpperCase() + cleanStatus.slice(1);
}

function getStatusClass(status) {
    const cleanStatus = normalizeStatus(status);
    if (cleanStatus === "completed") return "status-pill status-completed";
    if (cleanStatus === "processing") return "status-pill status-processing";
    return "status-pill status-pending";
}

function stageClass(currentStatus, stage) {
    const order = { pending: 0, processing: 1, completed: 2 };
    const currentIndex = order[normalizeStatus(currentStatus)];
    const stageIndex = order[stage];
    return stageIndex <= currentIndex ? "order-stage active" : "order-stage";
}

async function bindAccountOrderTracking() {
    const list = document.getElementById("orderTrackingList");
    if (!list) return;

    const profile = getProfile() || {};
    const email = (profile.email || "").trim();
    if (!email) {
        list.innerHTML = "<div class=\"summary-item\"><span>Add an email to your account to track orders.</span></div>";
        return;
    }

    const orders = await getCustomerOrders(email);
    if (!orders.length) {
        list.innerHTML = "<div class=\"summary-item\"><span>No orders yet. Your placed orders will appear here.</span></div>";
        return;
    }

    const latestOrderId = localStorage.getItem("lastOrderId");
    list.innerHTML = orders.map((order) => {
        const status = normalizeStatus(order.status);
        const items = Array.isArray(order.items) ? order.items : [];
        const itemSummary = items.map((item) => `${item.name || "Item"} x${Number(item.quantity || 0)}`).join(", ");
        const latestTag = latestOrderId && latestOrderId === order.id ? "<span class=\"status-pill status-processing\">Latest</span>" : "";

        return `
        <article class="order-card">
          <div class="order-card-head">
            <div>
              <strong>Order #${order.id.slice(0, 8)}</strong>
              <p>${formatDate(order.createdAt)}</p>
            </div>
            <div class="order-status-wrap">
              ${latestTag}
              <span class="${getStatusClass(status)}">${toStatusLabel(status)}</span>
            </div>
          </div>
          <div class="order-stages" aria-label="Order stage">
            <span class="${stageClass(status, "pending")}">Pending</span>
            <span class="${stageClass(status, "processing")}">Processing</span>
            <span class="${stageClass(status, "completed")}">Completed</span>
          </div>
          <p><strong>Items:</strong> ${itemSummary || "No items listed"}</p>
          <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
        </article>
      `;
    }).join("");
}

function guardProtectedPage() {
    const requiresAuth = document.body?.dataset?.requiresAuth === "true";
    if (requiresAuth && !localStorage.getItem("token")) {
        window.location.href = "/pages/login.html";
    }
}

window.handleLogin = async function () {
    const email = document.getElementById("email").value ;
    const password = document.getElementById("password").value ;

    const status = await login(email , password)

    if(status === 1) {
        alert("Login successful");
        window.location.href = "/pages/home.html";

    } else {
        alert("Invalid login")
    }
}


window.handleLogout = async function () {
    await logout();
    alert("Logout successful");
    window.location.href = "/index.html";
};

document.addEventListener("DOMContentLoaded", async function () {
    guardProtectedPage();
    bindAccountCTA();
    bindAccountPageDetails();
    bindCheckoutDetails();
    await bindAccountOrderTracking();
});
