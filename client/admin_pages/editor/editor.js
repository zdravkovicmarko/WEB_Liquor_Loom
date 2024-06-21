document.getElementById('addIngredient').addEventListener('click', () => {
    const ingredientInput = document.getElementById('ingredient');
    const measureInput = document.getElementById('measure');
    const ingredientsList = document.getElementById('ingredientsList');

    if (ingredientInput.value && measureInput.value) {
        const ingredient = ingredientInput.value;
        const measure = measureInput.value;

        // Create a new div to display the added ingredient and measure
        const ingredientDiv = document.createElement('div');
        ingredientDiv.className = 'ingredient-item';

        // Create a span to hold the ingredient text
        const ingredientText = document.createElement('span');
        ingredientText.textContent = `Ingredient: ${ingredient}, Measure: ${measure}`;

        // Add hidden input fields to hold the values
        const ingredientHiddenInput = document.createElement('input');
        ingredientHiddenInput.type = 'hidden';
        ingredientHiddenInput.name = 'ingredients[]';
        ingredientHiddenInput.value = JSON.stringify({ ingredient, measure });

        // Create a button to remove the ingredient
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.innerHTML = '&times;'; // Red cross
        removeButton.addEventListener('click', () => {
            ingredientDiv.remove();
        });

        ingredientDiv.appendChild(ingredientText);
        ingredientDiv.appendChild(ingredientHiddenInput);
        ingredientDiv.appendChild(removeButton);
        ingredientsList.appendChild(ingredientDiv);

        // Clear the input fields
        ingredientInput.value = '';
        measureInput.value = '';
    } else {
        alert('Please enter both ingredient and measure');
    }
});

document.getElementById('save').addEventListener('click', () => {
    const formData = {
        id: document.getElementById('cocktail_id').value,
        name: document.getElementById('cocktail_name').value,
        category: document.getElementById('cocktail_category').value,
        alcoholic: document.getElementById('cocktail_alcoholic').value,
        glass: document.getElementById('cocktail_glass').value,
        instructions: document.getElementById('cocktail_instructions').value,
        thumbnail: document.getElementById('cocktail_thumbnail').value,
        ingredients: [],
        measures: []
    };

    const hiddenInputs = document.querySelectorAll('input[name="ingredients[]"]');

    hiddenInputs.forEach(input => {
        const { ingredient, measure } = JSON.parse(input.value);
        formData.ingredients.push(ingredient);
        formData.measures.push(measure);
    });

    console.log("This is my FormData: ",formData);
    // You can now send this formData to your server using fetch or another method
    fetch('/add-cocktail', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    }).then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');

    // Function to handle search action
    const handleSearch = async () => {
        const searchText = searchInput.value.trim(); // Get input value and trim whitespace

        if (searchText) {
            try {
                // Call backend API to search by cocktail name
                const response = await fetch(`/api/cocktail/name/${encodeURIComponent(searchText)}`);
                if (!response.ok) {
                    console.log('Failed to fetch cocktail');
                }

                const cocktail = await response.json();
                console.log('Cocktail found:', cocktail);
                // Handle displaying the cocktail data or further processing
            } catch (error) {
                console.error('Error fetching cocktail:', error);
                // Handle error case, e.g., display an error message
            }
        } else {
            alert('Please enter a cocktail name');
        }

        // Clear input after search
        searchInput.value = '';
    };

    // Event listener for Enter key press
    searchInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            await handleSearch();
        }
    });
});