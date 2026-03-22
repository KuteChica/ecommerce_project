import { signUp } from "../../backend/server.js";

window.handleSignup = async function () {
    const name = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Email and password are required.");
        return;
    }

    const result = await signUp(name, email, phone, password);
    
    if (result.ok) {
        alert("Account created successfully");
        window.location.href = "/pages/home.html";
    } else {
        alert(`Signup failed: ${result.code}`);
    }
}
