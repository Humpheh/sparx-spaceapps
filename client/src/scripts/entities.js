import * as PIXI from "pixi.js";
import EE, { E_ENTITY_DISPATCH_ACTIONS, E_SET_WORLD_LOCK } from "./events";
import { TILE_SIZE } from "./world";

export class Entity {
    constructor(x, y, texture, entitySpec) {
        this.entitySpec = entitySpec;

        this.sprite = new PIXI.Sprite(texture);

        // x,y is in the tile coordinate system
        this.sprite.anchor.set(0.5);
        this.sprite.x = x * TILE_SIZE;
        this.sprite.y = y * TILE_SIZE;
        this.sprite.width = TILE_SIZE * (this.entitySpec.tileScale || 1);
        this.sprite.height = TILE_SIZE * (this.entitySpec.tileScale || 1);

        this.events = entitySpec.events;

        this.dispatchInteractionActions = this.dispatchInteractionActions.bind(this);

        this.movementLocked = false;
        EE.on(E_SET_WORLD_LOCK, (x) => this.movementLocked = x);
    }

    isWalkable() {
        return !!this.entitySpec.walkable;
    }

    dispatchInteractionActions() {
        if (this.entitySpec.events) {
            EE.emit(E_ENTITY_DISPATCH_ACTIONS, this.entitySpec.events);
        }
    }

    ticker(delta) {
        if (this.entitySpec.move) {
            this._doMove(delta);
        }
    }

    _doMove(delta) {
        if (this.movementLocked) {
            return;
        }
        this.moveIndex = this.moveIndex || 0;

        let target = this.entitySpec.move[this.moveIndex];

        let xDiff = this.sprite.x - (target.x * TILE_SIZE);
        let yDiff = this.sprite.y - (target.y * TILE_SIZE);

        if (Math.abs(xDiff) > 10) {
            this.sprite.x += (xDiff > 0 ? -1 : 1) * delta;
        }
        if (Math.abs(yDiff) > 10) {
            this.sprite.y += (yDiff > 0 ? -1 : 1) * delta;
        }

        if (Math.abs(xDiff) < 10 && Math.abs(yDiff) < 10) {
            this.moveIndex = (this.moveIndex+1) % this.entitySpec.move.length;
        }
    }
}