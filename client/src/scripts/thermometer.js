import * as PIXI from "pixi.js";
import EE, {
    E_SET_GLOBAL,
    E_SET_TEMPRATURE,
    E_SET_WEATHER_INTENSITY
} from "./events";

export class Thermometer {
    constructor() {
        this.temperature = 50;

        this.container = new PIXI.Container();

        let graphics = new PIXI.Graphics();
        graphics.lineStyle(3, 0xFFFFFF, 1);
        graphics.beginFill(0xFFFFFF, 0.8);
        graphics.drawRoundedRect(80, 70, 200, 15, 7.5);
        graphics.endFill();

        graphics.lineStyle(3, 0xFFFFFF, 1);
        graphics.beginFill(0xFF0000, 1);
        graphics.drawCircle(93, 77.5, 15);
        graphics.endFill();

        this.container.addChild(graphics);
        this.setBar();

        let thermoIcon = new PIXI.Sprite(PIXI.loader.resources['thermo'].texture);
        thermoIcon.anchor.set(0.5);
        thermoIcon.x = 40;
        thermoIcon.y = 79;
        thermoIcon.scale.x = 0.7;
        thermoIcon.scale.y = 0.7;
        this.container.addChild(thermoIcon);

        EE.on(E_SET_TEMPRATURE, (temp) => {
            this.setTemperature(temp);
        });
        EE.on(E_SET_WEATHER_INTENSITY, intensity => {
            this.temperature = 20 + (50-intensity*50);
            this.setBar();
        });

        this.container.alpha = 0;
        EE.on(E_SET_GLOBAL, (vals) => {
            if (vals.keys === 'thermometer' && vals.value) {
                this.container.alpha = 1;
            }
        });
    }

    setBar() {
        if (this.bar) {
            this.container.removeChild(this.bar);
        }
        this.bar = new PIXI.Graphics();

        this.bar.beginFill(0xFF0000, 1);
        this.bar.drawRoundedRect(80, 71,
            200 * (this.temperature / 100),
            14, 7.5);

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