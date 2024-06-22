import {displayMessage} from "/client/base.js";
const alertSuccess = document.getElementById('alert-success');
const alertError = document.getElementById('alert-error');

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById("search");
    const addIngredientBtn = document.getElementById("add_ingredient_btn");
    const deleteIngredientBtn = document.getElementById("delete_ingredient_btn");
    const cocktailForm = document.getElementById('cocktail-form');
    const saveBtn = document.getElementById("save-btn");
    const deleteBtn = document.getElementById('delete-btn');

    // Handle element inputs when searching cocktail name
    searchInput.addEventListener('keypress', async (event) => {
        if (event.key !== 'Enter') return;

        const searchText = event.target.value.trim();
        if (!searchText) return;

        try {
            const response = await fetch(`/api/cocktail/name/${encodeURIComponent(searchText)}`);
            const cocktail = await response.json();

            if (!response.ok || cocktail.error) {
                displayMessage(alertError, 'Cocktail not found', 5000);
            } else {
                displayMessage(alertSuccess, `Cocktail found: ${cocktail.name} (ID: ${cocktail.id})`, 5000);
                console.log(cocktail);

                // Populate form fields with retrieved cocktail data
                document.getElementById('cocktail_id').value = cocktail.id || '';
                document.getElementById('cocktail_name').value = cocktail.name || '';
                document.getElementById('cocktail_category').value = cocktail.category || '';
                document.getElementById('cocktail_alcoholic').value = cocktail.alcoholic || '';
                document.getElementById('cocktail_glass').value = cocktail.glass || '';
                document.getElementById('cocktail_instructions').value = cocktail.instructions || '';
                document.getElementById('cocktail_thumbnail').value = cocktail.thumbnail || '';
                displayIngredientsAndMeasures(cocktail.ingredients);

                searchInput.value = '';
            }
        } catch (error) {
            console.error('Error fetching cocktail:', error);
            displayMessage(alertError, 'Error fetching cocktail', 5000);
        }
    });

    // Button event handlers
    addIngredientBtn.addEventListener('click', () => addIngredientInput());
    deleteIngredientBtn.addEventListener('click', () => deleteIngredientInput());
    deleteBtn.addEventListener('click', deleteCocktail);

    saveBtn.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default form submission
        cocktailForm.checkValidity() ? saveCocktail() : displayMessage(alertError, 'Please fill out all required fields.', 5000);
    });
});

// Create all ingredient element inputs for found cocktail
function displayIngredientsAndMeasures(ingredients) {
    const ingredientsContainer = document.getElementById('ingredients_container');
    const ingredientDivs = ingredientsContainer.querySelectorAll('.element-inner-container');
    ingredientDivs.forEach(div => div.remove());
    ingredients.forEach((item, index) => addIngredientInput(item.ingredient, item.measure, index));
}

// Create empty ingredient element input dynamically
function addIngredientInput(ingredient = '', measure = '', index = null) {
    const ingredientsContainer = document.getElementById('ingredients_container');
    const ingredientDiv = document.createElement('div');
    ingredientDiv.className = 'element-inner-container';

    const ingredientInput = document.createElement('input');
    ingredientInput.className = 'element-input ingredient-item';
    ingredientInput.type = 'text';
    ingredientInput.name = 'ingredient';
    ingredientInput.placeholder = 'Ingredient';
    ingredientInput.value = ingredient;
    ingredientInput.required = true;

    const measureInput = document.createElement('input');
    measureInput.className = 'element-input measure-item';
    measureInput.type = 'text';
    measureInput.name = 'measure';
    measureInput.placeholder = 'Measure';
    measureInput.value = measure;

    ingredientDiv.appendChild(ingredientInput);
    ingredientDiv.appendChild(measureInput);

    // Give ingredients & measures unique ID (either using provided index or counted containers)
    const currentCount = ingredientsContainer.querySelectorAll('.element-inner-container').length;
    ingredientInput.id = `ingredient${index !== null ? index + 1 : currentCount + 1}`;
    measureInput.id = `measure${index !== null ? index + 1 : currentCount + 1}`;

    ingredientsContainer.insertBefore(ingredientDiv, document.getElementById('add_ingredient_btn'));
}

// Delete last ingredient element input
function deleteIngredientInput() {
    const ingredientsContainer = document.getElementById('ingredients_container');
    const ingredientDivs = ingredientsContainer.querySelectorAll('.element-inner-container');
    if (ingredientDivs.length > 0) ingredientsContainer.removeChild(ingredientDivs[ingredientDivs.length - 1]);
}

// Save cocktail using PUT (cocktailID in DB) & POST (cocktailID not in DB) endpoint
async function saveCocktail() {
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

    // Gather ingredient & measure inputs
    const ingredientDivs = document.querySelectorAll('#ingredients_container .element-inner-container');
    ingredientDivs.forEach(div => {
        const ingredient = div.querySelector('input[name="ingredient"]').value;
        const measure = div.querySelector('input[name="measure"]').value;
        formData.ingredients.push(ingredient);
        formData.measures.push(measure);
    });

    console.log("This is my FormData: ", formData);

    try {
        const response = await fetch(`/api/cocktail/id/${formData.id}`);
        const data = await response.json();

        if (response.ok && data) { // ID exists in DB, use PUT to update cocktail
            const updateResponse = await fetch(`/recipe/${formData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (updateResponse.ok) {
                displayMessage(alertSuccess, 'Cocktail updated successfully', 5000);
                clearAllInputs();
            } else {
                displayMessage(alertError, 'Failed to update cocktail', 5000);
            }
        } else { // ID doesn't exist in DB, use POST to create cocktail
            const createResponse = await fetch('/add-cocktail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (createResponse.ok) {
                displayMessage(alertSuccess, 'Cocktail created successfully', 5000);
                clearAllInputs();
            } else {
                displayMessage(alertError, 'Failed to create cocktail', 5000);
            }
        }
    } catch (error) {
        console.error('Error saving cocktail:', error);
        displayMessage(alertError, 'Error saving cocktail', 5000);
    }
}

// Delete cocktail using DELETE endpoint
async function deleteCocktail() {
    const cocktailId = document.getElementById('cocktail_id').value;
    try {
        const deleteResponse = await fetch(`/recipe/${cocktailId}`, {
            method: 'DELETE'
        });

        if (deleteResponse.ok) {
            displayMessage(alertSuccess, 'Cocktail deleted successfully', 5000);
            clearAllInputs();
        } else {
            displayMessage(alertError, `Failed to delete cocktail: ${deleteResponse.error}`, 5000);
        }
    } catch (error) {
        console.error('Error deleting cocktail:', error);
        displayMessage(alertError, 'Error deleting cocktail', 5000);
    }
}

// Clear all regular input fields & dynamically added ingredient inputs
function clearAllInputs() {
    const inputDivs = document.querySelectorAll('.element-input');
    inputDivs.forEach(input => input.value = '');

    const ingredientsContainer = document.getElementById('ingredients_container');
    const ingredientDivs = ingredientsContainer.querySelectorAll('.element-inner-container');
    ingredientDivs.forEach(div => div.remove());
}