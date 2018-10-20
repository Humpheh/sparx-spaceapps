import '../styles/index.scss';
import * as PIXI from 'pixi.js';
import { World } from "./world";

let app = new PIXI.Application(
    document.body.clientWidth, 800,
    {backgroundColor : 0x1099bb}
);
document.body.appendChild(app.view);

let world = new World();
app.stage.addChild(world.container);

// Listen for animate update
app.ticker.add(function(delta) {
});

