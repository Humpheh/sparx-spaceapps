import * as PIXI from "pixi.js";
import EE, {
    E_ADD_HUNGER,
    E_RUN_EVENTS,
    E_SET_HUNGER_ABSOLUTE
} from "./events";

export const MAX_HUNGER = 100;

export class HungerMeter {
    constructor() {
        this.hunger = MAX_HUNGER;

        this.container = new PIXI.Container();

        let graphics = new PIXI.Graphics();
        graphics.lineStyle(4, 0xFFFFFF, 1);
        graphics.beginFill(0xFFFFFF, 0.8);
        graphics.drawRoundedRect(80, 20, 200, 30, 5);
        graphics.endFill();

        this.container.addChild(graphics);
        this.setBar();

        let fishIcon = new PIXI.Sprite(PIXI.loader.resources['fish'].texture);
        fishIcon.anchor.set(0.5);
        fishIcon.x = 40;
        fishIcon.y = 35;
        fishIcon.scale.x = 0.7;
        fishIcon.scale.y = 0.7;
        fishIcon.rotation = -Math.PI / 7;
        this.container.addChild(fishIcon);

        EE.on(E_ADD_HUNGER, (diff) => {
            this.addHunger(diff);
        });

        EE.on(E_SET_HUNGER_ABSOLUTE, (newHunger) => {
            this.hunger = newHunger;
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
        this.bar.drawRoundedRect(80, 20,
            200 * (this.hunger / MAX_HUNGER),
            30, 5);
        this.bar.endFill();

        this.container.addChild(this.bar);
    }

    getComponent() {
        return this.container;
    }

    addHunger(diff) {
        this.hunger += diff;
        if (this.hunger > MAX_HUNGER) {
            this.hunger = MAX_HUNGER;
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
                this.hunger = MAX_HUNGER;
                this.setBar();
            });
        } else {
            this.setBar();
        }
    }
}
