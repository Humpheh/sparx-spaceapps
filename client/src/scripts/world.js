import * as PIXI from "pixi.js";
import yaml from "js-yaml";


const tileSize = 64;

class Tile {
    constructor(x, y, sprite) {
        this.x = x;
        this.y = y;

        // Can't move through it
        this.sprite = sprite ? Tile.loadSprite(sprite) : null;
        this.solid = !(this.sprite);
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


class FixedEntity {
    constructor(x, y, resourceData) {
        let texture = new PIXI.Texture.fromLoader(resourceData);
        this.sprite = new PIXI.Sprite(texture);

        // x,y is in the tile coordinate system
        this.sprite.anchor.set(0.5);
        this.sprite.x = x * tileSize;
        this.sprite.y = y * tileSize;
        this.sprite.width = tileSize;
        this.sprite.height = tileSize;
    }
}

export class World {
    constructor(world) {
        this.container = new PIXI.Container();

        // Tiles in the world
        this.world = [];

        // Entities present in the world
        this.entities = [];

        this.fileToTileData(world, td => this.loadWorld(td));
        this.loadWorldSpec();
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

    loadWorldSpec() {
        let loader = new PIXI.loaders.Loader();
        loader.add('worldSpec', 'public/assets/worlds/world1.yaml');
        loader.load((loader, resources) => {
            let spec = yaml.safeLoad(resources.worldSpec.data);
            this.worldSpec = spec;
        });
        loader.onComplete.add(() => {
            this.placeEntities(this.worldSpec.fixedEntities);
        });
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

    placeEntities(entities) {
        let loader = new PIXI.loaders.Loader();

        for (let entity of entities) {
            if (typeof(entity.sprite) !== 'undefined') {
                loader.add(entity.sprite, 'public/assets/sprites/' + entity.sprite);
            }
        }

        loader.onComplete.add(() => {
            for (let entity of entities) {
                this.entities.push(new FixedEntity(
                    entity.x, entity.y,
                    loader.resources[entity.sprite].data
                ));
            }

            for (let entity of this.entities) {
                this.container.addChild(entity.sprite);
            }
        });

        loader.load();
    }

    createTile(x, y, data) {
        let gridSpace = new Tile(x, y, data);
        if (gridSpace.sprite) {
            this.container.addChild(gridSpace.sprite);
        }
        return gridSpace;
    }

    getTile(x, y) {
        let row = this.world[y] || [];
        return row[x];
    }

    isSolid(x, y) {
        let tile = this.getTile(x, y);
        return !tile || tile.solid;
    }

    isPositionOkay(x, y) {
        let xt = Math.round(x / tileSize);
        let yt = Math.round(y / tileSize);
        return !this.isSolid(xt, yt);
    }
}
