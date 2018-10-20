import * as PIXI from "pixi.js";

const tileSize = 64;

class Tile {
    constructor(x, y, sprite) {
        this.x = x;
        this.y = y;

        // Can't move through it
        this.solid = true;
        this.sprite = sprite ? Tile.loadSprite(sprite) : null;
        if (this.sprite) {
            this.sprite.anchor.set(0.5);
            this.sprite.x = x * tileSize;
            this.sprite.y = y * tileSize;
            this.sprite.width = tileSize;
            this.sprite.height = tileSize;
        }
    }

    static loadSprite(textureLocation) {
        // create a new Sprite from an image path
        const texture = PIXI.Texture.fromImage('public/assets/sprites/' + textureLocation + '.png');
        return new PIXI.Sprite(texture);
    }
}


export class World {
    constructor(world) {
        this.container = new PIXI.Container();

        this.world = [];
        this.fileToTileData(world, td => this.loadWorld(td));
    }

    loadWorld(tileData) {
        this.world = [];
        for (let y = 0; y < tileData.length; y++) {
            let row = [];
            for (let x = 0; x < tileData[y].length; x++) {
                let tile = this.createTile(x, y, tileData[y][x]);
                row.push(tile);
            }
            this.world.push(row);
        }
    }

    fileToTileData(world, callback) {
        let loader = PIXI.loader.add('world', 'public/assets/worlds/world1.csv');
        loader.load((loader, resources) => {
            let world = resources.world.data;
            let rows = world.split(/\r\n|\n/);

            let tileData = [];
            for (let y = 0; y < rows.length; y++) {
                tileData.push(rows[y].split(','));
            }
            callback(tileData);
        });
    }

    createTile(x, y, data) {
        let gridSpace = new Tile(x, y, data);
        if (gridSpace.sprite) {
            this.container.addChild(gridSpace.sprite);
        }
        return gridSpace;
    }

    getTile(x, y) {
        return this.world[x][y];
    }

    isSolid(x, y) {
        let tile = this.getTile(x, y);
        return !tile || tile.solid;
    }
}

