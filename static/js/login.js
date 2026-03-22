import { login, logout } from "../../backend/server.js";

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

document.addEventListener("DOMContentLoaded", function () {
    guardProtectedPage();
    bindAccountCTA();
    bindAccountPageDetails();
    bindCheckoutDetails();
});
