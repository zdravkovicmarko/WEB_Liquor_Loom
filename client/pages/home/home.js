document.addEventListener("DOMContentLoaded", () => {
    const range = document.querySelector("#slide");
    const slideValue = document.querySelector(".slide-value");

    // Initialize the slide value display
    slideValue.innerText = range.value;

    // Update slide value and print to console when slider value changes
    range.addEventListener("input", () => {
        slideValue.innerText = range.value;
        console.log("Slider value:", range.value);
    });
});
