import '../styles/index.scss';
import * as PIXI from 'pixi.js';
import { Character } from "./character";
import { World } from "./world";

let app = new PIXI.Application(
    document.body.clientWidth, 800,
    {backgroundColor : 0x1099bb}
);
document.body.appendChild(app.view);

let world = new World();
app.stage.addChild(world.container);

let character = new Character();
character.setLocation(app.screen.width / 2, app.screen.height / 2);
app.stage.addChild(character.container);

// Listen for animate update
app.ticker.add(function(delta) {
});

// Character position updates
app.ticker.add(character.keyboardTick);
