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
    collidesWith,
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

        this.animationFrames = {
            b: this.makeAnimation('b', [1, 2, 3, 2]),
            f: this.makeAnimation('f', [1, 2, 3, 2]),
            l: this.makeAnimation('l', [1, 2, 3, 2]),
            r: this.makeAnimation('r', [1, 2, 3, 2]),
        };

        let animation = new PIXI.extras.AnimatedSprite(this.animationFrames.b);
        animation.animationSpeed = 0.1;
        animation.width = animation.width*0.5;
        animation.height = animation.height*0.5;
        animation.anchor.set(0.5, 0.75);
        animation.play();

        this.container.addChild(animation);

        this.sprite = animation;

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
        EE.on(E_SET_WORLD_LOCK, (x) => {
            this.movementLocked = x;
            if (x) {
                this.sprite.stop();
            }
        });

        this.velocityX = 0;
        this.velocityY = 0;

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

    makeAnimation(dir, idx) {
        let frames = [];
        for (let i of idx) {
            // magically works since the spritesheet was loaded with the pixi loader
            frames.push(PIXI.Texture.fromFrame('penguin_'+ dir + i + '.png'));
        }
        return frames;
    }

    keyboardTick(delta, world) {
        if (this.movementLocked) {
            // If movement is locked don't let the keyboard events
            // do anything
            return;
        }

        const moveBy = delta * MOVE_PER_TICK;

        let hasMoved = false;

        let frames = this.sprite.textures;

        this.velocityX = this.velocityX * 0.2;
        this.velocityY = this.velocityY * 0.2;

        if (this.moveDown.isKeyDown) {
            this.velocityY += moveBy;
            hasMoved = true;
            frames = this.animationFrames.f;
        }
        if (this.moveUp.isKeyDown) {
            this.velocityY -= moveBy;
            hasMoved = true;
            frames = this.animationFrames.b;
        }
        let newY = this.sprite.y + this.velocityY;
        if (world.isPositionOkay(this.sprite.x, newY)) {
            this.sprite.y = newY;
        }

        if (this.moveLeft.isKeyDown) {
            this.velocityX -= moveBy;
            hasMoved = true;
            frames = this.animationFrames.r;
        }
        if (this.moveRight.isKeyDown) {
            this.velocityX += moveBy;
            hasMoved = true;
            frames = this.animationFrames.l;
        }
        let newX = this.sprite.x + this.velocityX;
        if (world.isPositionOkay(newX, this.sprite.y)) {
            this.sprite.x = newX;
        }

        if (hasMoved) {
            if (this.sprite.textures !== frames) {
                this.sprite.textures = frames;
            }
            this.sprite.play();
            EE.emit(E_PLAYER_MOVED, new PlayerMovedContext(this.sprite.x, this.sprite.y));
        } else {
            this.sprite.stop();
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

    collidesWith(entity) {
        return collidesWith(entity, this.sprite.x, this.sprite.y);
    }
}
