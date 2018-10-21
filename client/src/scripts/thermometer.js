import * as PIXI from "pixi.js";
import EE, { E_ADD_HUNGER, E_RUN_EVENTS, E_SET_TEMPRATURE } from "./events";

export class Thermometer {
    constructor() {
        this.temperature = 50;

        this.container = new PIXI.Container();

        let graphics = new PIXI.Graphics();
        graphics.lineStyle(2, 0xFFFFFF, 1);
        graphics.beginFill(0xFFFFFF, 0.8);
        graphics.drawRoundedRect(20, 70, 200, 15, 7.5);
        graphics.endFill();

        this.container.addChild(graphics);
        this.setBar();

        EE.on(E_SET_TEMPRATURE, (temp) => {
            this.setTemperature(temp);
        });
    }

    setBar() {
        if (this.bar) {
            this.container.removeChild(this.bar);
        }
        this.bar = new PIXI.Graphics();

        this.bar.beginFill(0xFF0000, 0.8);
        this.bar.drawRoundedRect(20, 70,
            200 * (this.temperature / 100),
            15, 7.5);

        this.bar.lineStyle(2, 0xFFFFFF, 1);
        this.bar.beginFill(0xFF0000, 1);
        this.bar.drawCircle(30, 77.5, 15);
        this.bar.endFill();

        this.container.addChild(this.bar);
    }

    getComponent() {
        return this.container;
    }

    setTemperature(value) {
        this.temperature = value;
        this.setBar();
    }
}