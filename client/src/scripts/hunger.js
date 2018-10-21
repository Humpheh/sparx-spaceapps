import * as PIXI from "pixi.js";
import EE, { E_ADD_HUNGER, E_RUN_EVENTS } from "./events";

export class HungerMeter {
    constructor() {
        this.hunger = 100;

        this.container = new PIXI.Container();

        let graphics = new PIXI.Graphics();
        graphics.lineStyle(4, 0xFFFFFF, 1);
        graphics.beginFill(0xFFFFFF, 0.8);
        graphics.drawRoundedRect(20, 20, 200, 30, 5);
        graphics.endFill();

        this.container.addChild(graphics);
        this.setBar();

        EE.on(E_ADD_HUNGER, (diff) => {
            this.addHunger(diff);
        });
    }

    setBar() {
        if (this.bar) {
            this.container.removeChild(this.bar);
        }
        this.bar = new PIXI.Graphics();

        let colour = 0xFFA500;
        if (this.hunger < 25) {
            colour = 0xFF0000;
        }
        this.bar.beginFill(colour, 0.8);
        this.bar.drawRoundedRect(20, 20,
            200 * (this.hunger / 100),
            30, 5);
        this.bar.endFill();

        this.container.addChild(this.bar);
    }

    getComponent() {
        return this.container;
    }

    addHunger(diff) {
        this.hunger += diff;
        if (this.hunger > 100) {
            this.hunger = 100;
        }

        if (this.hunger <= 0) {
            this.hunger = 0;
            // TODO: we should do something better?
            EE.emit(E_RUN_EVENTS, [{
                type: 'text',
                text: 'You have run out of food!',
            }, {
                type: 'slide',
                image: 'black_slide',
                events: [{
                    type: 'text',
                    text: '...                                \nTux blacked out.' // Oh yeah >:)
                }]
            }], () => {
                this.hunger = 100;
                this.setBar();
            });
        } else {
            this.setBar();
        }
    }
}