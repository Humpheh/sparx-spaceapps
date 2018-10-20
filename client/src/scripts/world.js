import * as PIXI from "pixi.js";

// create a new Sprite from an image path
let texture = PIXI.Texture.fromImage('public/assets/spx_X_white.jpg');

class Tile {
    constructor(x, y, texture) {
        this.x = x;
        this.y = y;

        // Can't move through it
        this.solid = true;
        this.sprite = texture ? new PIXI.Sprite(texture) : null;

        this.sprite.anchor.set(0.5);
        this.sprite.x = x * tileSize;
        this.sprite.y = y * tileSize;
        this.sprite.width = tileSize;
        this.sprite.height = tileSize;
    }
}

const tileSize = 64;

export class World {
    constructor() {
        this.container = new PIXI.Container();

        this.world = [];
        for (let y = 0; y < 100; y++) {
            let row = [];
            for (let x = 0; x < 100; x++) {
                let gridSpace = new Tile(x, y, texture);

                if (gridSpace.sprite) {
                    this.container.addChild(gridSpace.sprite);
                }
                row.push(gridSpace);
            }
            this.world.push(row);
        }
    }

    isSolid(x, y) {
        let tile = this.world[x][y];
        return !tile || tile.solid;
    }
}

