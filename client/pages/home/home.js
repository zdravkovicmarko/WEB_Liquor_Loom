document.addEventListener("DOMContentLoaded", () => {
    const range = document.querySelector("#slide");
    const slideValue = document.querySelector(".slide-value");

    // Initialize the slide value display
    slideValue.innerText = "≥ " + range.value;
    console.log("Initial slider value:", range.value); // Log initial value

    // Function to update slide value and log it to the console
    const updateSlideValue = (value) => {
        value === "5" ? slideValue.innerText = value : slideValue.innerText = "≥ " + value;
        console.log("Updated slider value:", value);
    };

    // Add event listener directly in JavaScript
    range.addEventListener("input", (event) => {
        updateSlideValue(event.target.value);
    });
});
