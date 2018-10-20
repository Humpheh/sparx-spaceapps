import * as PIXI from 'pixi.js';

const TEXT_PADDING = 20;

export class TextPrompt {
    constructor(text, x, y, w, h) {
        this.textLen = 0;
        this.text = text;
        this.timer = 0;

        this.container = new PIXI.Container();

        const style = new PIXI.TextStyle({
            fontFamily: 'Tahoma',
            fontSize: 22,
            // dropShadow: true,
            // dropShadowColor: '#00000055',
            // dropShadowBlur: 7,
            // dropShadowAngle: Math.PI/2,
            dropShadowDistance: 2,
            wordWrap: true,
            wordWrapWidth: w - TEXT_PADDING*2
        });

        this.textComponent = new PIXI.Text('', style);
        this.textComponent.x = x + TEXT_PADDING;
        this.textComponent.y = y + TEXT_PADDING;

        let graphics = new PIXI.Graphics();
        graphics.lineStyle(5, 0xFFFFFF, 1);
        graphics.beginFill(0xFFFFFF, 0.8);
        graphics.drawRoundedRect(x+5, y+5, w-10, h-10, 10);
        graphics.endFill();

        this.container.addChild(graphics);
        this.container.addChild(this.textComponent);
    }

    getContainer() {
        return this.container;
    }

    ticker(delta) {
        // Don't add characters if we've reached it
        if (this.textLen === this.text.length) {
            return;
        }
        this.timer += delta;
        if (this.timer > 1) {
            this.textLen += 1;
            this.textComponent.text = this.text.substr(0, this.textLen);
            this.timer = 0;
        }
    }
}
