import * as PIXI from "pixi.js";

import EE, {
    E_PLAYER_MOVED, E_SET_WORLD_LOCK,
} from "./events";
import {
    KeyboardEventHandler,
    KEY_DOWN,
    KEY_UP,
    KEY_LEFT,
    KEY_RIGHT,
} from "./keyboard";
import {
    tileToGlobal
} from "./world";
import yaml from "js-yaml";

const SPRITE_IMAGE = 'public/assets/bunny.png';
const MOVE_PER_TICK = 3;

class PlayerMovedContext {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class Character {
    constructor() {
        this.container = new PIXI.Container();

        const sprite = PIXI.Sprite.fromImage(SPRITE_IMAGE);
        sprite.anchor.set(0.5);
        this.container.addChild(sprite);

        this.sprite = sprite;

        this.moveDown = new KeyboardEventHandler(KEY_DOWN);
        this.moveUp = new KeyboardEventHandler(KEY_UP);
        this.moveLeft = new KeyboardEventHandler(KEY_LEFT);
        this.moveRight = new KeyboardEventHandler(KEY_RIGHT);
        this.moveDown.bindListeners();
        this.moveUp.bindListeners();
        this.moveLeft.bindListeners();
        this.moveRight.bindListeners();

        this.keyboardTick = this.keyboardTick.bind(this);

        // This may be a bad idea
        this.movementLocked = false;
        EE.on(E_SET_WORLD_LOCK, (x) => this.movementLocked = x);

        // Load start point for world 1
        this.loadPlayerSpec();
    }

    loadPlayerSpec() {
        let loader = new PIXI.loaders.Loader();
        loader.add('playerSpec', 'public/assets/player/player.yaml');
        loader.load((loader, resources) => {
            this.playerSpec = yaml.safeLoad(resources.playerSpec.data);
        });
        loader.onComplete.add(() => {
            this.setLocation(
                tileToGlobal(this.playerSpec.startLocations.world1.x),
                tileToGlobal(this.playerSpec.startLocations.world1.y)
            );
        });
    }

    keyboardTick(delta, world) {
        if (this.movementLocked) {
            // If movement is locked don't let the keyboard events
            // do anything
            return;
        }

        const moveBy = delta * MOVE_PER_TICK;

        let hasMoved = false;

        let newX = this.sprite.x;
        let newY = this.sprite.y;

        if (this.moveDown.isKeyDown) {
            newY += moveBy;
            hasMoved = true;
        }
        if (this.moveUp.isKeyDown) {
            newY -= moveBy;
            hasMoved = true;
        }
        if (world.isPositionOkay(this.sprite.x, newY)) {
            this.sprite.y = newY;
        }

        if (this.moveLeft.isKeyDown) {
            newX -= moveBy;
            hasMoved = true;
        }
        if (this.moveRight.isKeyDown) {
            newX += moveBy;
            hasMoved = true;
        }
        if (world.isPositionOkay(newX, this.sprite.y)) {
            this.sprite.x = newX;
        }

        if (hasMoved) {
            EE.emit(E_PLAYER_MOVED, new PlayerMovedContext(this.sprite.x, this.sprite.y));
        }
    }

    setLocation(x, y) {
        this.sprite.x = x;
        this.sprite.y = y;
    }

    getX() {
        return this.sprite.x;
    }

    getY() {
        return this.sprite.y;
    }
}
