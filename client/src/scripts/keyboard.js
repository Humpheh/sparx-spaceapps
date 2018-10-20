
export const KEY_DOWN = 40;
export const KEY_UP = 38;
export const KEY_LEFT = 37;
export const KEY_RIGHT = 39;


export class KeyboardEventHandler {
    constructor(keyCode, onPress = null, onRelease = null) {
        // default properties
        Object.assign(this, {
            "isKeyDown": false,
        });

        this.allowRepeat = true;
        this.keyCode = keyCode;

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
    }

    downHandler(evt) {
        if (evt.keyCode === this.keyCode) {
            if (this.allowRepeat || !this.isKeyDown) {
                this.isKeyDown = true;
                this.onPress();
            }
        }
        evt.preventDefault();
    }

    upHandler(evt) {
        if (evt.keyCode === this.keyCode) {
            this.isKeyDown = false;
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
