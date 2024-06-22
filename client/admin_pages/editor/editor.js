import {displayMessage} from "/client/base.js";

const alertSuccess = document.getElementById('alert-success');
const alertError = document.getElementById('alert-error');

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById("search");
    const addIngredientBtn = document.getElementById("add_ingredient_btn");
    const deleteIngredientBtn = document.getElementById("delete_ingredient_btn");
    const saveBtn = document.getElementById("save-btn");

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

                document.getElementById('cocktail_id').value = cocktail.id || '';
                document.getElementById('cocktail_name').value = cocktail.name || '';
                document.getElementById('cocktail_category').value = cocktail.category || '';
                document.getElementById('cocktail_alcoholic').value = cocktail.alcoholic || '';
                document.getElementById('cocktail_glass').value = cocktail.glass || '';
                document.getElementById('cocktail_instructions').value = cocktail.instructions || '';
                document.getElementById('cocktail_thumbnail').value = cocktail.thumbnail || '';
                displayIngredientsAndMeasures(cocktail.ingredients);
            }
        } catch (error) {
            console.error('Error fetching cocktail:', error);
            displayMessage(alertError, 'Error fetching cocktail', 5000);
        } finally {
            searchInput.value = '';
        }
    });

    addIngredientBtn.addEventListener('click', () => addIngredientInput());
    deleteIngredientBtn.addEventListener('click', () => deleteIngredientInput());
    saveBtn.addEventListener('click', saveCocktail);
});

function displayIngredientsAndMeasures(ingredients) {
    const ingredientsContainer = document.getElementById('ingredients_container');
    const ingredientDivs = ingredientsContainer.querySelectorAll('.element-inner-container');
    ingredientDivs.forEach(div => div.remove());
    ingredients.forEach((item, index) => addIngredientInput(item.ingredient, item.measure, index));
}

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

    const measureInput = document.createElement('input');
    measureInput.className = 'element-input measure-item';
    measureInput.type = 'text';
    measureInput.name = 'measure';
    measureInput.placeholder = 'Measure';
    measureInput.value = measure;

    ingredientDiv.appendChild(ingredientInput);
    ingredientDiv.appendChild(measureInput);

    if (index !== null) {
        ingredientInput.id = `ingredient${index + 1}`;
        measureInput.id = `measure${index + 1}`;
    } else {
        const currentCount = ingredientsContainer.querySelectorAll('.element-inner-container').length;
        ingredientInput.id = `ingredient${currentCount + 1}`;
        measureInput.id = `measure${currentCount + 1}`;
    }

    const addButton = document.getElementById('add_ingredient_btn');
    ingredientsContainer.insertBefore(ingredientDiv, addButton);
}

function deleteIngredientInput() {
    const ingredientsContainer = document.getElementById('ingredients_container');
    const ingredientDivs = ingredientsContainer.querySelectorAll('.element-inner-container');
    if (ingredientDivs.length > 0) ingredientsContainer.removeChild(ingredientDivs[ingredientDivs.length - 1]);
}

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

    const ingredientDivs = document.querySelectorAll('#ingredients_container .element-inner-container');
    ingredientDivs.forEach(div => {
        const ingredient = div.querySelector('input[name="ingredient"]').value;
        const measure = div.querySelector('input[name="measure"]').value;
        formData.ingredients.push(ingredient);
        formData.measures.push(measure);
    });

    console.log("This is my FormData: ", formData);

    try {
        const response = await fetch(`/api/cocktail/${formData.id}`);
        const data = await response.json();

        if (response.ok && data) { // ID exists, use PUT to update
            const updateResponse = await fetch(`/api/cocktail/${formData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (updateResponse.ok) {
                displayMessage(alertSuccess, 'Cocktail updated successfully', 5000);
            } else {
                displayMessage(alertError, 'Failed to update cocktail', 5000);
            }
        } else { // ID does not exist, use POST to create
            const createResponse = await fetch('/add-cocktail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (createResponse.ok) {
                displayMessage(alertSuccess, 'Cocktail created successfully', 5000);
            } else {
                displayMessage(alertError, 'Failed to create cocktail', 5000);
            }
        }
    } catch (error) {
        console.error('Error saving cocktail:', error);
        displayMessage(alertError, 'Error saving cocktail', 5000);
    }
}