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
module.exports = Cocktail;