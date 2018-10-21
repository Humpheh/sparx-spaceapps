
export const KEY_DOWN = 40;
export const KEY_UP = 38;
export const KEY_LEFT = 37;
export const KEY_RIGHT = 39;
export const KEY_SPACE = 32;
export const KEY_ESCAPE = 27;


export class KeyboardEventHandler {
    constructor(keyCode, onPress = null, onRelease = null) {
        // default properties
        Object.assign(this, {
            "isKeyDown": false,
            "isKeyUp": true,
        });

        this.allowRepeat = true;
        this.keyCode = keyCode;

        this.oneShot = false;
        this.everPressed = false;

        if (onPress !== null) {
            this.onPress = onPress;
        }
        if (onRelease !== null) {
            this.onRelease = onRelease;
        }
    }

    bindListeners() {
        window.addEventListener(
            "keydown", this.downHandler.bind(this), false
        );
        window.addEventListener(
            "keyup", this.upHandler.bind(this), false
        );

        // allow chaining
        return this;
    }

    downHandler(evt) {
        if (evt.keyCode !== this.keyCode) {
            return;
        }

        if (this.everPressed && this.oneShot) {
            return;
        }

        this.everPressed = true;

        if (this.allowRepeat || !this.isKeyDown) {
            this.isKeyDown = true;
            this.isKeyUp = false;
            this.onPress();
        }
        evt.preventDefault();
    }

    upHandler(evt) {
        if (evt.keyCode === this.keyCode) {
            this.isKeyDown = false;
            this.isKeyUp = true;
            this.onRelease();
        }
        evt.preventDefault();
    }

    // default onPress and onRelease handlers
    onPress() {
        return;
    }

    onRelease() {
        return;
    }
}
