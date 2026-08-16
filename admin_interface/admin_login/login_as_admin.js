
// EYE ICON
const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("admin_password");
const eyeIcon = document.getElementById("eyeIcon");

togglePassword.addEventListener("click", () => {
    if(password.type === "password"){
        password.type = "text";
        eyeIcon.src = "assets_admin/eye.png";
    }else{
        password.type = "password";
        eyeIcon.src = "assets_admin/hides.png";
    }
});