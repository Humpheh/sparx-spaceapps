import * as PIXI from "pixi.js";

import {
    KeyboardEventHandler,
    KEY_DOWN,
    KEY_UP,
    KEY_LEFT,
    KEY_RIGHT,
} from "./keyboard";

const SPRITE_IMAGE = 'public/assets/bunny.png';
const MOVE_PER_TICK = 3;

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
    }

    keyboardTick(delta) {
        const moveBy = delta * MOVE_PER_TICK;

        if (this.moveDown.isKeyDown) {
            this.sprite.y += moveBy;
        }
        if (this.moveUp.isKeyDown) {
            this.sprite.y -= moveBy;
        }
        if (this.moveLeft.isKeyDown) {
            this.sprite.x -= moveBy;
        }
        if (this.moveRight.isKeyDown) {
            this.sprite.x += moveBy;
        }
    }

    setLocation(x, y) {
        this.sprite.x = x;
        this.sprite.y = y;
    }
}


class CharacterKeyboardListener {
    constructor(character) {
        this.character = character;
        this.eventHandlers = [];
    }

    bindKey() {
        let handler = new KeyboardEventHandler(
            KEY_DOWN,
            () => {
                let y = this.character.getY();
                this.character.sprite.y = y + 5;
            }
        );
        handler.bindListeners();
        this.eventHandlers.push(handler);
    }
}
