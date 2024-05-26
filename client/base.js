document.addEventListener('DOMContentLoaded', function () {
    const searchBarInput = document.getElementById('search');

    searchBarInput.addEventListener('input', function() {
        const searchBar = this.closest('.search-bar');
        this.value.trim() !== ''? searchBar.classList.add('input-hovered') : searchBar.classList.remove('input-hovered');
    });
});