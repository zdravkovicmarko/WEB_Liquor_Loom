range = document.querySelector("#slide");
slideValue = document.querySelector(".rating-bar .slide-value");
range.addEventListener("input", () => {
    slideValue.innerText = range.value;
});