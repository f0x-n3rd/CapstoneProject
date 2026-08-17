
document.addEventListener("DOMContentLoaded", function () {
    const slider = document.querySelector(".card_slider");
    const cards = document.querySelectorAll(".empty_card");
    if (!slider || cards.length === 0) {
        return;
    }
    let currentIndex = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let autoSlide;

    /* =========================
       MOVE SLIDER
    ========================= */
    function moveSlider(index, smooth = true) {
        if (index >= cards.length) {
            index = 0;
        }
        if (index < 0) {
            index = cards.length - 1;
        }
        currentIndex = index;
        slider.style.transition = smooth
            ? "transform 0.45s ease"
            : "none";
        slider.style.transform =
            "translateX(-" + (currentIndex * 100) + "%)";
    }

    /* =========================
       NEXT
    ========================= */
    function nextSlide() {

        if (currentIndex >= cards.length - 1) {
            moveSlider(0);
        } else {
            moveSlider(currentIndex + 1);
        }

    }


    /* =========================
       PREVIOUS
    ========================= */
    function previousSlide() {
        if (currentIndex <= 0) {
            moveSlider(cards.length - 1);
        } else {
            moveSlider(currentIndex - 1);
        }

    }


    /* =========================
       AUTO SLIDE
    ========================= */
    function startAutoSlide() {
        clearInterval(autoSlide);
        autoSlide = setInterval(function () {
            nextSlide();
        }, 5000);

    }


    /* =========================
       TOUCH START
    ========================= */
    slider.addEventListener("touchstart", function (event) {
        startX = event.touches[0].clientX;
        currentX = startX;
        isDragging = true;
        clearInterval(autoSlide);
        slider.style.transition = "none";
    }, { passive: true });


    /* =========================
       TOUCH MOVE
    ========================= */
    slider.addEventListener("touchmove", function (event) {
        if (!isDragging) {
            return;
        }

        currentX = event.touches[0].clientX;
        const difference = currentX - startX;
        const percentage =
            (difference / slider.parentElement.offsetWidth) * 100;
        const position =
            -(currentIndex * 100) + percentage;
        slider.style.transform =
            "translateX(" + position + "%)";
    }, { passive: true });


    /* =========================
       TOUCH END
    ========================= */
    slider.addEventListener("touchend", function () {
        if (!isDragging) {
            return;
        }

        isDragging = false;
        const difference = currentX - startX;
        const minimumSwipe = 50;

        /* Swipe LEFT */
        if (difference < -minimumSwipe) {
            nextSlide();
        }
        /* Swipe RIGHT */
        else if (difference > minimumSwipe) {
            previousSlide();
        }
        /* Hindi sapat ang swipe */
        else {
            moveSlider(currentIndex);
        }
        startAutoSlide();
    });


/* =========================
DESKTOP MOUSE DRAG
========================= */
let mouseStartX = 0;
let mouseCurrentX = 0;
let mouseDragging = false;

/* MOUSE DOWN */
slider.addEventListener("mousedown", function (event) {
    mouseDragging = true;
    mouseStartX = event.clientX;
    mouseCurrentX = event.clientX;
    clearInterval(autoSlide);
    slider.style.transition = "none";
    slider.style.cursor = "grabbing";
    event.preventDefault();
});

/* MOUSE MOVE */
slider.addEventListener("mousemove", function (event) {
    if (!mouseDragging) {
        return;
    }
    mouseCurrentX = event.clientX;
    const difference = mouseCurrentX - mouseStartX;
    const percentage = (difference / slider.parentElement.offsetWidth) * 100;
    const position =  -(currentIndex * 100) + percentage;
    slider.style.transform =
        "translateX(" + position + "%)";
});

/* MOUSE UP */
document.addEventListener("mouseup", function () {
    if (!mouseDragging) {
        return;
    }
    mouseDragging = false;
    slider.style.cursor = "grab";
    const difference = mouseCurrentX - mouseStartX;
    /* Mas maliit = mas madaling swipe */
    const minimumSwipe = 30;

    /* DRAG LEFT */
    if (difference < -minimumSwipe) {
        nextSlide();
    }

    /* DRAG RIGHT */
    else if (difference > minimumSwipe) {
        previousSlide();
    }

    /* HINDI SAPAT ANG DRAG */
    else {
        moveSlider(currentIndex);
    }
    startAutoSlide();
});
});
