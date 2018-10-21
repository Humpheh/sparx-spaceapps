import * as PIXI from "pixi.js";
import yaml from "js-yaml";
import log from "loglevel";

import {
    E_APPEND_GLOBAL, E_DEPEND_GLOBAL,
    E_ABORT_EVENT_FLOW,
    E_START_QUEUING_EVENTS, E_STOP_QUEUING_EVENTS,
    E_DESTROY_ENTITY,
    E_INC_GLOBAL,
    E_SET_GLOBAL,
    E_GO_TO_WORLD,
    E_SET_WEATHER_INTENSITY,
    E_REQUEST_PLACE_ENTITY,
    E_SET_ENTITY_POSITION,
    E_SET_HUNGER_ABSOLUTE,
    makeEventHander, E_SET_CHARACTER_OPACITY
} from "./events";
import { MAX_HUNGER } from "./hunger";
import { getRandomInt } from "./utils";
import { KeyboardEventHandler } from "./keyboard";

import EE, {
    E_PLAYER_MOVED,
} from "./events";
import { Entity, FishEntity } from "./entities";

const DEFAULT_WEATHER_INTENSITY = 0.0;

export const TILE_SIZE = 64;
export const FISH_CHANCE = 0.002;

let randomisedTiles = {
    'ice_m1': ['ice_m1', 'ice_m1a'],
    'ice_m2': ['ice_m2', 'ice_m2a', 'ice_m2b'],
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

        let tileData = this.fileToTileData(id);
        this.loadWorld(tileData);
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

        EE.on(E_REQUEST_PLACE_ENTITY, (id) => {
            console.log("placing entity " + id);
            this.entities.forEach((e, i) => {
                if (e.id === id) {
                    e.setVisible(true);
                }
            });
        });

        EE.on(E_SET_ENTITY_POSITION, ({ id, x, y }) => {
            this.entities.forEach((e, i) => {
                if (e.id === id) {
                    e.setLocation(x, y);
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
                if (tile && Math.random() < FISH_CHANCE) {
                    this.createFish(x, y);
                }
                row.push(tile);
            }
            this.world.push(row);
        }
    }

    createFish(x, y) {
        let fish = new FishEntity(x, y);
        this.container.addChild(fish.sprite);
        this.entities.push(fish);
    }

    loadWorldSpec(world) {
        let worldSpec = PIXI.loader.resources['world' + world + '_spec'].data;
        this.worldSpec = yaml.safeLoad(worldSpec);
        this.placeEntities(this.worldSpec.entities);

        const intensity = this.worldSpec.initialWeatherIntensity || DEFAULT_WEATHER_INTENSITY;
        EE.emit(E_SET_WEATHER_INTENSITY, intensity);
    }

    fileToTileData(world) {
        let worldData = PIXI.loader.resources['world' + world + '_tiles'].data;
        let rows = worldData ? worldData.split(/\r\n|\n/) : '';

        let tileData = [];
        for (let y = 0; y < rows.length; y++) {
            tileData.push(rows[y].split(','));
        }
        return tileData;
    }

    placeEntities(entities) {
        for (let entity of entities) {
            this.entities.push(new Entity(
                entity.x, entity.y,
                PIXI.loader.resources[entity.sprite].texture,
                entity
            ));

            if (entity.spawnKey) {
                if (typeof entity.id === 'undefined') {
                    log.error("Entities with spawnKey must have an id!");
                }

                new KeyboardEventHandler(
                    entity.spawnKey.charCodeAt(0),
                    () => { EE.emit(E_REQUEST_PLACE_ENTITY, entity.id); }
                )
                    .bindListeners()
                    .oneShot = true;
            }
        }

        for (let entity of this.entities) {
            this.container.addChild(entity.sprite);
        }
    }

    createTile(x, y, data) {
        let parts = data.split(',');
        let img = parts[0];
        if (img.trim() === '') {
            return null;
        }
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

    doDetectCollisions(x, y) {
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
    constructor(uiContainer) {
        this.uiContainer = uiContainer;

        this.values = {};
        this.world = null;
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

    setSepia(on) {
        if (this.sepia && !on) {
            this.uiContainer.removeChild(this.sepia);
        } else if (!this.sepia && on) {
            this.sepia = new PIXI.Sprite(PIXI.loader.resources['sepia'].texture);
            this.sepia.x = 0;
            this.sepia.y = 0;
            this.sepia.alpha = 0.5;
            this.uiContainer.addChild(this.sepia);
        }
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

    doDetectCollisions(x, y) {
        this.world && this.world.doDetectCollisions(x, y);
    }

    registerWorldChangeCallback(fn) {
        this.worldChangeCallbacks.push(fn);
    }

    registerEventListeners() {
        EE.on(E_GO_TO_WORLD, (worldId) => this._setWorld(worldId));
    }

    _setWorld(id) {
        console.log("Setting world to: " + id);

        // Break any active event flow on world change
        EE.emit(E_ABORT_EVENT_FLOW);

        EE.emit(E_START_QUEUING_EVENTS);

        if (this.world) {
            console.log("Removing previous world");
            this.container.removeChild(this.world.container);
        }

        this.world = new World(id);
        this.container.addChild(this.world.container);

        this.setSepia(this.world.worldSpec.sepia);

        EE.emit(E_SET_CHARACTER_OPACITY, this.world.worldSpec.hideCharacter ? 0 : 1);

        for (let cb of this.worldChangeCallbacks) {
            cb(this.world, this);
        }

        EE.emit(E_SET_HUNGER_ABSOLUTE, MAX_HUNGER);
        EE.emit(E_STOP_QUEUING_EVENTS);
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
