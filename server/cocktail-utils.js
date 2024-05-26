const Cocktail = require('./cocktail-model')

function processCocktailData(data) {
    // Log the received data to debug the structure
    console.log('Received data:', JSON.stringify(data, null, 2));

    // Check if the drinks array exists
    if (!data || !data.drinks || !Array.isArray(data.drinks)) {
        throw new Error('Unexpected data format from API');
    }

    return data.drinks.map(drink => {
        // Ensure the drink object is not null
        if (!drink) return null;

        // Extract ingredients and measures from the object
        const ingredients = [];
        const measures = [];
        for (let i = 1; i <= 15; i++) {
            const ingredient = drink[`strIngredient${i}`];
            const measure = drink[`strMeasure${i}`];
            if (ingredient) {
                ingredients.push(ingredient);
            }
            if (measure) {
                measures.push(measure);
            }

        }

        // Create a new Cocktail object
        return new Cocktail(
            drink.idDrink,
            drink.strDrink,
            drink.strCategory,
            drink.strAlcoholic,
            drink.strGlass,
            drink.strInstructions,
            drink.strDrinkThumb,
            ingredients,
            measures
        );

    }).filter(cocktail => cocktail !== null);
    // Filter out any null entries

}

// Export the function for use in other files
module.exports = {
    processCocktailData
};