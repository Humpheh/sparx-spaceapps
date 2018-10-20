import * as PIXI from "pixi.js";
import yaml from "js-yaml";
import { makeEventHander } from "./events";

import EE, {
    E_ENTITY_DISPATCH_ACTIONS,
    E_PLAYER_MOVED,
} from "./events";


const tileSize = 64;

class Tile {
    constructor(x, y, sprite) {
        this.x = x;
        this.y = y;

        // Can't move through it
        this.sprite = sprite.trim() ? Tile.loadSprite(sprite) : null;
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
    constructor(x, y, resourceData, entitySpec) {
        let texture = new PIXI.Texture.fromLoader(resourceData);
        this.sprite = new PIXI.Sprite(texture);

        // x,y is in the tile coordinate system
        this.sprite.anchor.set(0.5);
        this.sprite.x = x * tileSize;
        this.sprite.y = y * tileSize;
        this.sprite.width = tileSize;
        this.sprite.height = tileSize;

        this.events = entitySpec.events;

        this.dispatchInteractionActions = this.dispatchInteractionActions.bind(this);
    }

    dispatchInteractionActions() {
        EE.emit(E_ENTITY_DISPATCH_ACTIONS, this.events);
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
        let loader = new PIXI.loaders.Loader();
        loader.add('worldSpec', 'public/assets/worlds/world1.yaml');
        loader.load((loader, resources) => {
            this.worldSpec = yaml.safeLoad(resources.worldSpec.data);
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
                    loader.resources[entity.sprite].data,
                    entity
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
}

function collidesWith(entity, x, y) {
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
    return size * tileSize;
}
