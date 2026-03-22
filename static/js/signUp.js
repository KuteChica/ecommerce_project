import { signUp } from "../../backend/server.js";

window.handleSignup = async function () {
    const nameField = document.getElementById("username");
    const emailField = document.getElementById("email");
    const phoneField = document.getElementById("phone");
    const passField = document.getElementById("password");

    const fullName = nameField ? nameField.value.trim() : "";
    const emailText = emailField ? emailField.value.trim() : "";
    const phoneText = phoneField ? phoneField.value.trim() : "";
    const passText = passField ? passField.value.trim() : "";

    if (!emailText || !passText) {
        alert("Email and password are required.");
        return;
    }

    const signResult = await signUp(fullName, emailText, phoneText, passText);

    if (signResult.ok) {
        alert("Account created successfully");
        window.location.href = "/pages/home.html";
        return;
    }

    alert(`Signup failed: ${signResult.code}`);
};
