class Cocktail {
    constructor(id, name, category, alcoholic, glass, instructions, thumbnail, ingredients, measures) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.alcoholic = alcoholic;
        this.glass = glass;
        this.instructions = instructions;
        this.thumbnail = thumbnail;
        this.ingredients = ingredients;
        this.measures = measures;
    }
}

function processCocktailData(drinks) {
    return drinks.map(drink => {

        // Extrahiere Zutaten und Maße aus dem Objekt
        const ingredients = [];
        const measures = [];
        for (let i = 1; i <= 15; i++) {
            const ingredient = `strIngredient${i}`;
            const measure = `strMeasure${i}`;
            if (ingredient && measure) {
                ingredients.push(ingredient);
                measures.push(measure);
            }
        }
        // Erstelle ein neues Cocktail-Objekt
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
    });
}

// Exportieren Sie die Funktion, um sie in anderen Dateien zu verwenden
module.exports = {
    processCocktailData
};