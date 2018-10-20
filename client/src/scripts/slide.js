import * as PIXI from "pixi.js";
import { GameApp } from "./index";

export class Slide {
    // w and h here are the size of the window
    constructor(image, parentContainer, worldContainer, conf, finishCallback) {
        this.finishCallback = finishCallback;

        this.container = new PIXI.Container();

        let par = PIXI.loader.resources[image].texture;
        this.sprite = new PIXI.Sprite(par);
        this.sprite.x = GameApp.renderer.width/2;
        this.sprite.y = GameApp.renderer.height/2;
        this.sprite.anchor.set(0.5, 0.5);
        this.container.addChild(this.sprite);

        let startX = GameApp.renderer.width/2 - this.sprite.width / 2;
        let startY = GameApp.renderer.height/2 - this.sprite.height / 2;

        for (let hitbox of conf.hitboxes) {
            let check = hitbox.showIf;
            let show = !check ? true :
                worldContainer.doCheck(check.key, check.check, check.case);

            let hitboxarea = new PIXI.Graphics();
            hitboxarea.beginFill(0x000000, show ? 0.25 : 0);
            hitboxarea.drawRect(startX+hitbox.x, startY+hitbox.y, hitbox.w, hitbox.h);
            hitboxarea.endFill();
            hitboxarea.interactive = true;
            hitboxarea.on('mousedown', (e) => {
                this.triggerEvent(hitbox.events);
            });

            this.container.addChild(hitboxarea);
        }

        this.parentContainer = parentContainer;
        parentContainer.addChild(this.container);
    }

    triggerEvent(events){
        if (this.disabled) {
            return;
        }
        console.log('clicked on hitbox', events);
        if (events) {
            this.disabled = true;
            this.finishCallback && this.finishCallback(events, () => {
                this.disabled = false;
            });
        } else {
            this.finishCallback && this.finishCallback();
            this.parentContainer.removeChild(this.container);
        }
    }

    ticker(delta){}
}