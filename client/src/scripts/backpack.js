import * as PIXI from "pixi.js";

export class BackpackBar {
    constructor() {
        this.container = new PIXI.Container();
        this.container.width = 100;
    }

    getComponent() {
        return this.container;
    }

    renderBackpack(items) {
        this.container.removeChildren();
        for (let sprite of getSprites(items)) {
            this.container.addChild(sprite);
        }
    }
}

function getSprites(items) {
    let sprites = [];
    for (let item of items) {
        sprites.push(new PIXI.Sprite(
            PIXI.loader.resources[item].texture
        ));
    }
    return sprites;
}
