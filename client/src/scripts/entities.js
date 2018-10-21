import * as PIXI from "pixi.js";
import EE, {
    E_ADD_HUNGER,
    E_DESTROY_ENTITY,
    E_ENTITY_DISPATCH_ACTIONS,
    E_SET_WORLD_LOCK
} from "./events";
import { KeyboardEventHandler } from "./keyboard";
import { TILE_SIZE } from "./world";

export class Entity {
    constructor(x, y, texture, entitySpec) {
        this.id = entitySpec.id || 'ALL_OTHER_ENTITIES';
        this.entitySpec = entitySpec;

        this.sprite = new PIXI.Sprite(texture);

        // x,y is in the tile coordinate system
        this.sprite.anchor.set(0.5);
        this.sprite.x = x * TILE_SIZE;
        this.sprite.y = y * TILE_SIZE;
        this.sprite.width = TILE_SIZE * (this.entitySpec.tileScale || 1);
        this.sprite.height = TILE_SIZE * (this.entitySpec.tileScale || 1);

        if (entitySpec.flip) {
            this.sprite.width = -this.sprite.width;
        }

        this.events = entitySpec.events;

        this.dispatchInteractionActions = this.dispatchInteractionActions.bind(this);

        this.movementLocked = false;
        EE.on(E_SET_WORLD_LOCK, (x) => this.movementLocked = x);

        this.setVisible(entitySpec.spawnVisible || typeof entitySpec.spawnVisible === 'undefined');
    }

    setVisible(visible) {
        this.visible = visible;
        this.sprite.alpha = (visible) ? 1.0 : 0.0;
    }

    isWalkable() {
        return !!this.entitySpec.walkable;
    }

    dispatchInteractionActions() {
        if (!this.visible) {
            return;
        }

        if (this.entitySpec.events) {
            EE.emit(E_ENTITY_DISPATCH_ACTIONS, this.entitySpec.events);
        }
    }

    ticker(delta, character) {
        if (this.entitySpec.move) {
            this._doMove(delta, character);
        }
    }

    setLocation(x, y) {
        this.sprite.x = x;
        this.sprite.y = y;
    }

    _doMove(delta, character) {
        if (this.movementLocked) {
            return;
        }
        this.moveIndex = this.moveIndex || 0;

        let speed = this.entitySpec.moveSpeed || 1;
        let target = this.entitySpec.move[this.moveIndex];

        let xDiff = this.sprite.x - (target.x * TILE_SIZE);
        let yDiff = this.sprite.y - (target.y * TILE_SIZE);

        let movedX = 0, movedY = 0;
        if (Math.abs(xDiff) > 10) {
            movedX = (xDiff > 0 ? -1 : 1) * delta * speed;
            this.sprite.x += movedX;
        }
        if (Math.abs(yDiff) > 10) {
            movedY = (yDiff > 0 ? -1 : 1) * delta * speed;
            this.sprite.y += movedY;
        }

        if (character.collidesWith(this)) {
            character.sprite.x += movedX;
            character.sprite.y += movedY;
        }

        if (Math.abs(xDiff) < 10 && Math.abs(yDiff) < 10) {
            this.moveIndex = (this.moveIndex+1) % this.entitySpec.move.length;
        }
    }
}

export class FishEntity extends Entity {
    constructor(x, y) {
        let id = Math.random();
        super(x, y, PIXI.loader.resources['fish'].texture, {
            id: id,
            events: [{
                type: 'event',
                event: E_ADD_HUNGER,
                content: 25,
            }, {
                type: 'event',
                event: E_DESTROY_ENTITY,
                content: id,
            }]
        });
        this.startY = this.sprite.y;
        this.time = Math.random()*200;
    }

    ticker(delta, character) {
        this.time += delta;
        let sinTime = Math.sin(this.time/15);
        sinTime = sinTime > 0 ? 0 : sinTime;
        this.sprite.y = this.startY + (sinTime * 10);
        this.sprite.rotation = sinTime * Math.PI/10 * Math.random();
    }
}