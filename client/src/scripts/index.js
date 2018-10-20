import '../styles/index.scss';
import * as PIXI from 'pixi.js';
import { Character } from "./character";
import { World } from "./world";

let app = new PIXI.Application(
    window.innerWidth,
    window.innerHeight,
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
app.ticker.add(t => {
    character.keyboardTick(t, world);
    app.stage.pivot.x = character.getX() - app.renderer.width/2;
    app.stage.pivot.y = character.getY() - app.renderer.height/2;
});
