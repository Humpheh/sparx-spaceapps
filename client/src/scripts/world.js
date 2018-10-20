import * as PIXI from "pixi.js";
import yaml from "js-yaml";

import {
    E_APPEND_GLOBAL, E_DEPEND_GLOBAL,
    E_ABORT_EVENT_FLOW,
    E_DESTROY_ENTITY,
    E_INC_GLOBAL,
    E_SET_GLOBAL,
    E_GO_TO_WORLD,
    makeEventHander
} from "./events";
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
    constructor(x, y, sprite, solid) {
        this.x = x;
        this.y = y;

        // Can't move through it
        this.sprite = sprite.trim() ? Tile.loadSprite(sprite) : null;
        this.solid = !(this.sprite) || solid;
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

class World {
    constructor(id) {
        this.container = new PIXI.Container();

        // Tiles in the world
        this.world = [];

        // Entities present in the world
        this.entities = [];

        this.fileToTileData(id, td => this.loadWorld(td));
        this.loadWorldSpec(id);

        this.inCollision = new Set();

        EE.on(E_DESTROY_ENTITY, (id) => {
            this.entities.forEach((e, i) => {
                if (e.id === id) {
                    // Lol we already found it previously
                    const index = this.entities.indexOf(e);
                    this.entities.splice(index, 1);
                    this.container.removeChild(e.sprite);
                }
            });
        });
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

    loadWorldSpec(world) {
        let worldSpec = PIXI.loader.resources['world' + world + '_spec'].data;
        this.worldSpec = yaml.safeLoad(worldSpec);
        this.placeEntities(this.worldSpec.entities);
    }

    fileToTileData(world, callback) {
        let worldData = PIXI.loader.resources['world' + world + '_tiles'].data;
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
        let parts = data.split(',');
        let img = parts[0];
        let solid = (parts.length > 1 && parts[1] === 's');

        let gridSpace = new Tile(x, y, img, solid);
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

    getStartingPosition() {
        const playerStart = this.worldSpec.playerStart;
        if (typeof playerStart !== 'undefined' &&
            playerStart.x && playerStart.y) {
            return playerStart;
        } else {
            // TODO(matt): ensure this is actually on a tile!
            return {
                'x': 1,
                'y': 1,
            };
        }
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

    onPlayerMove(x, y) {
        let collidees = this.collidesAt(x, y);
        this.updateCollisionStates(collidees);
    }

    ticker(delta, character) {
        for (let entity of this.entities) {
            entity.ticker(delta, character);
        }
    }
}

export class WorldContainer {
    constructor(initialId) {
        this.values = {};

        this.world = null;
        this.setWorld = this.setWorld.bind(this);

        this.worldChangeCallbacks = [];

        this.container = new PIXI.Container();

        this.registerEventListeners();

        EE.on(E_SET_GLOBAL, (vals) => {
            this.values[vals.key] = vals.value;
            console.log('setting values', this.values);
        });
        EE.on(E_INC_GLOBAL, (vals) => {
            this.values[vals.key] = (this.values[vals.key] || 0) + vals.value;
            console.log('adding values', this.values);
        });
        EE.on(E_APPEND_GLOBAL, (vals) => {
            this.values[vals.key] = (this.values[vals.key] || []).concat([vals.value]);
            console.log('concat values', this.values);
        });
        EE.on(E_DEPEND_GLOBAL, (vals) => {
            const index = (this.values[vals.key] || []).indexOf(vals.value);
            if (index) {
                this.values[vals.key].splice(index, 1);
            }
            console.log('depend values', this.values);
        });
    }

    doCheck(key, val, check) {
        let value = this.values[key];
        if (!value) {
            return false;
        }
        switch (check) {
            case 'eq':
                return value == val;
            case 'gt':
                return value > val;
            case 'lt':
                return value < val;
        }
        console.error('unknown comparator', check);
        return false;
    }

    registerWorldChangeCallback(fn) {
        this.worldChangeCallbacks.push(fn);
    }

    registerEventListeners() {
        EE.on(E_PLAYER_MOVED, (context) => this.world.onPlayerMove(context.x, context.y), this.world);
        EE.on(E_GO_TO_WORLD, (worldId) => this.setWorld(worldId));
    }

    setWorld(id) {
        console.log("Setting world to: " + id);

        // Break any active event flow on world change
        EE.emit(E_ABORT_EVENT_FLOW);

        if (this.world) {
            console.log("Removing previous world");
            this.container.removeChild(this.world.container);
        }

        this.world = new World(id);
        this.container.addChild(this.world.container);

        for (let cb of this.worldChangeCallbacks) {
            cb(this.world);
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
