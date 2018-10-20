import * as PIXI from "pixi.js";
import yaml from "js-yaml";

import { makeEventHander } from "./events";
import { getRandomInt } from "./utils";

import EE, {
    E_PLAYER_MOVED,
} from "./events";
import { Entity } from "./entities";


export const TILE_SIZE = 64;

var randomisedTiles = {
    'ice_m1': ['ice_m1', 'ice_m1a'],
    'ice_m2': ['ice_m2', 'ice_m2a'],
    'ice_m3': ['ice_m3', 'ice_m3a']
};

class Tile {
    constructor(x, y, sprite) {
        this.x = x;
        this.y = y;

        // Can't move through it
        this.sprite = sprite.trim() ? Tile.loadSprite(sprite) : null;
        this.solid = !(this.sprite);
        if (this.sprite) {
            this.sprite.anchor.set(0.5);
            this.sprite.x = x * TILE_SIZE;
            this.sprite.y = y * TILE_SIZE;
            this.sprite.width = TILE_SIZE;
            this.sprite.height = TILE_SIZE;
        }
    }

    static loadSprite(textureLocation) {
        // create a new Sprite from an image path
        if (randomisedTiles.hasOwnProperty(textureLocation)) {
            const idx = getRandomInt(0, randomisedTiles[textureLocation].length - 1);
            textureLocation = randomisedTiles[textureLocation][idx];
        }
        const texture = PIXI.Texture.fromImage('public/assets/sprites/' + textureLocation + '.png');
        return new PIXI.Sprite(texture);
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

        this.inCollision = new Set();
        this.registerEventListeners();
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
        let worldSpec = PIXI.loader.resources['world1_spec'].data;
        this.worldSpec = yaml.safeLoad(worldSpec);
        this.placeEntities(this.worldSpec.entities);
    }

    fileToTileData(world, callback) {
        let worldData = PIXI.loader.resources['world1_tiles'].data;
        let rows = worldData.split(/\r\n|\n/);

        let tileData = [];
        for (let y = 0; y < rows.length; y++) {
            tileData.push(rows[y].split(','));
        }
        callback(tileData);
    }

    placeEntities(entities) {
        for (let entity of entities) {
            this.entities.push(new Entity(
                entity.x, entity.y,
                PIXI.loader.resources[entity.sprite].texture,
                entity
            ));
        }

        for (let entity of this.entities) {
            this.container.addChild(entity.sprite);
        }
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
        let xt = Math.round(x / TILE_SIZE);
        let yt = Math.round(y / TILE_SIZE);
        let solid = !this.isSolid(xt, yt);

        if (solid) {
            return solid;
        }

        // Check if the position has entities that are walkable
        for (let entity of this.entities) {
            if (collidesWith(entity, x, y)) {
                if (entity.isWalkable()) {
                    return true;
                }
            }
        }
        return false;
    }

    collidesAt(x, y) {
        let collidees = new Set();
        for (let entity of this.entities) {
            if (collidesWith(entity, x, y)) {
                collidees.add(entity);
            }
        }
        return collidees;
    }

    updateCollisionStates(newCollidees) {
        // Entities we are no longer in collision with
        this.inCollision.forEach((collidee) => {
            if (!newCollidees.has(collidee)) {
                this.inCollision.delete(collidee);
            }
        });

        // And look for new colliders, and tell them to dispatch actions
        newCollidees.forEach((collidee) => {
            if (!this.inCollision.has(collidee)) {
                this.inCollision.add(collidee);
                collidee.dispatchInteractionActions();
            }
        });
    }

    playerMoved(x, y) {
        let collidees = this.collidesAt(x, y);
        this.updateCollisionStates(collidees);
    }

    registerEventListeners() {
        EE.on(E_PLAYER_MOVED, (context) => this.playerMoved(context.x, context.y), this);
    }

    ticker(delta, character) {
        for (let entity of this.entities) {
            entity.ticker(delta, character);
        }
    }
}

export function collidesWith(entity, x, y) {
    // Character (x, y) is in collision with entity if the following all hold:
    //
    // entity_x_position - entity_width/2 <= x <= entity_x_position + entity_width/2
    // entity_y_position - entity_height/2 <= y <= entity_y_position + entity_height/2
    //
    // The character is currently modelled as a particle for this purpose. We
    // assume entities are anchored at their midpoint.

    const entity_x = entity.sprite.x;
    const entity_y = entity.sprite.y;
    const entity_w = entity.sprite.width;
    const entity_h = entity.sprite.height;

    const collidesX = (entity_x - (entity_w / 2) <= x) && (entity_x + (entity_w / 2) >= x);
    const collidesY = (entity_y - (entity_h / 2) <= y) && (entity_y + (entity_h / 2) >= y);

    return collidesX && collidesY;
}

export function tileToGlobal(size) {
    return size * TILE_SIZE;
}
