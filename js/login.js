const form = document.getElementById("loginForm");

form.addEventListener("submit", function(e){

e.preventDefault();

const emailValue = document.getElementById("email").value;
const passwordValue = document.getElementById("password").value;

if(emailValue && passwordValue){

const successToast = document.createElement("div");

successToast.style.cssText = `
position:fixed;
top:20px;
right:20px;
background:linear-gradient(135deg,#ffd700,#ffed4e);
color:#1a1a1a;
padding:20px 25px;
border-radius:12px;
font-weight:600;
z-index:1000;
`;

successToast.textContent = "✅ Login successful! Welcome to E-Shop.";

document.body.appendChild(successToast);

setTimeout(function(){

successToast.remove();
alert("Redirecting to dashboard...");

},2500);

}

});

document.getElementById("email").focus();