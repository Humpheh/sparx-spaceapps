import * as PIXI from "pixi.js";

const SPRITE_IMAGE = 'public/assets/bunny.png';

export class Character {
    constructor() {
        this.container = new PIXI.Container();

        const sprite = PIXI.Sprite.fromImage(SPRITE_IMAGE);
        sprite.anchor.set(0.5);
        this.container.addChild(sprite);

        this.sprite = sprite;
    }

    setLocation(x, y) {
        this.sprite.x = x;
        this.sprite.y = y;
    }
}
