import { adminLogin, adminSignUp } from "../../backend/server.js";

window.handleAdminLogin = async function () {
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    if (!email || !password) {
        alert("Email and password are required.");
        return;
    }

    const result = await adminLogin(email, password);
    if (!result.ok) {
        alert(result.message || "Admin login failed.");
        return;
    }

    alert("Admin login successful.");
    window.location.href = "/backend/dasboard.html";
};

window.handleAdminSignup = async function () {
    const name = document.getElementById("adminName").value.trim();
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    if (!name || !email || !password) {
        alert("Name, email, and password are required.");
        return;
    }

    const result = await adminSignUp(name, email, password);
    if (!result.ok) {
        alert(result.message || "Admin signup failed.");
        return;
    }

    alert("Admin account created.");
    window.location.href = "/backend/dasboard.html";
};
