import * as PIXI from 'pixi.js';

import {
    KeyboardEventHandler,
    KEY_SPACE,
} from "./keyboard";

const TEXT_PADDING = 20;

export class TextPrompt {
    constructor(text, x, y, w, h, parentContainer, finishCallback) {
        this.textLen = 0;
        this.text = text;
        this.timer = 0;

        this.finishCallback = finishCallback;

        this.dismissHandler = new KeyboardEventHandler(KEY_SPACE);

        this.container = new PIXI.Container();

        this.textComponent = new PIXI.Text('', new PIXI.TextStyle({
            fontFamily: 'Tahoma',
            fontSize: 22,
            wordWrap: true,
            wordWrapWidth: w - TEXT_PADDING*2
        }));

        this.textComponent.x = x + TEXT_PADDING;
        this.textComponent.y = y + TEXT_PADDING;

        let graphics = TextPrompt._makeBackground(x, y, w, h);
        this.readyPrompt = TextPrompt._makeReadyPrompt(x, y, w, h);

        this.container.addChild(graphics);
        this.container.addChild(this.textComponent);

        this.dismissHandler.bindListeners();

        this.parentContainer = parentContainer;
        parentContainer.addChild(this.container);

        this.ticker = this.ticker.bind(this);
    }

    static _makeBackground(x, y, w, h) {
        let graphics = new PIXI.Graphics();
        graphics.lineStyle(5, 0xFFFFFF, 1);
        graphics.beginFill(0xFFFFFF, 0.8);
        graphics.drawRoundedRect(x+5, y+5, w-10, h-10, 10);
        graphics.endFill();
        return graphics;
    }

    static _makeReadyPrompt(x, y, w, h) {
        let readyPrompt = new PIXI.Graphics();
        readyPrompt.lineStyle(0);
        readyPrompt.beginFill(0xFF00BB, 1);
        readyPrompt.drawRoundedRect(x+w-TEXT_PADDING-20, y+h-TEXT_PADDING-20, 20, 20, 4);
        readyPrompt.endFill();
        return readyPrompt;
    }

    onFinish() {
        this.finishCallback && this.finishCallback();
        this.parentContainer.removeChild(this.container);
    }

    ticker(delta) {
        this.timer += delta;
        if (this.timer > 1) {
            this.textLen += 1;
        }

        // Don't add characters if we've reached it
        if (!this.finished && this.timer > 1) {
            this.textComponent.text = this.text.substr(0, this.textLen);
            this.timer = 0;

            if (this.textLen >= this.text.length) {
                this.finished = true;
            }
        } else if (this.timer > 20) {
            if (!this._hasprompt) {
                this.container.addChild(this.readyPrompt);
                this._hasprompt = true;
            } else {
                this.container.removeChild(this.readyPrompt);
                this._hasprompt = false;
            }
            this.timer = 0;
        }

        if (this.dismissHandler.isKeyDown && !this.flopped) {
            this.flopped = true;
            if (!this.finished) {
                this.textLen = this.text.length;
            } else {
                this.onFinish();
            }
        }
        // This is a bit rubbish
        if (this.dismissHandler.isKeyUp) {
            this.flopped = false;
        }
    }
}
