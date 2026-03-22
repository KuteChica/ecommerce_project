import { adminLogin, adminSignUp } from "../../backend/server.js";

window.handleAdminLogin = async function () {
    const adminEmailInput = document.getElementById("adminEmail");
    const adminPasswordInput = document.getElementById("adminPassword");

    const emailValue = adminEmailInput ? adminEmailInput.value.trim() : "";
    const passwordValue = adminPasswordInput ? adminPasswordInput.value.trim() : "";

    if (!emailValue || !passwordValue) {
        alert("Email and password are required.");
        return;
    }

    const loginRes = await adminLogin(emailValue, passwordValue);
    if (!loginRes.ok) {
        alert(loginRes.message || "Admin login failed.");
        return;
    }

    alert("Admin login successful.");
    window.location.href = "/backend/dasboard.html";
};

window.handleAdminSignup = async function () {
    const nameInput = document.getElementById("adminName");
    const emailInput = document.getElementById("adminEmail");
    const passwordInput = document.getElementById("adminPassword");

    const nameValue = nameInput ? nameInput.value.trim() : "";
    const emailValue = emailInput ? emailInput.value.trim() : "";
    const passwordValue = passwordInput ? passwordInput.value.trim() : "";

    if (!nameValue || !emailValue || !passwordValue) {
        alert("Name, email, and password are required.");
        return;
    }

    const signRes = await adminSignUp(nameValue, emailValue, passwordValue);
    if (!signRes.ok) {
        alert(signRes.message || "Admin signup failed.");
        return;
    }

    alert("Admin account created.");
    window.location.href = "/backend/dasboard.html";
};
