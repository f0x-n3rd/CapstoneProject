
document.addEventListener("click", function (e) {

    if (!e.target.classList.contains("read_more")) return;

    e.preventDefault();
    e.stopPropagation();

    const button = e.target;
    const text = button.previousElementSibling;

    text.classList.toggle("expanded");

    button.textContent = text.classList.contains("expanded")
        ? "Read less"
        : "Read more";
});