// PASSWORD FIELD
const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const eyeIcon = document.getElementById("eyeIcon");

// CONFIRM PASSWORD FIELD
const confirmPassword = document.getElementById("confirmPassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const confirmEyeIcon = document.getElementById("confirmEyeIcon");

// SHOW/HIDE PASSWORD
togglePassword.addEventListener("click", function () {
    if (password.type === "password") {
        password.type = "text";
        eyeIcon.src = "register/assets_reg/eye.png";
    } else {
        password.type = "password";
        eyeIcon.src = "register/assets_reg/hides.png";
    }
});

// SHOW/HIDE CONFIRM PASSWORD
toggleConfirmPassword.addEventListener("click", function () {
    if (confirmPassword.type === "password") {
        confirmPassword.type = "text";
        confirmEyeIcon.src = "register/assets_reg/eye.png";
    } else {
        confirmPassword.type = "password";
        confirmEyeIcon.src = "register/assets_reg/hides.png";
    }
});

// PASSWORD MATCH CHECK
document.querySelector("form").addEventListener("submit", function (e) { 
    if (password.value !== confirmPassword.value) { 
        e.preventDefault(); alert("Passwords do not match."); 
    } 
});

