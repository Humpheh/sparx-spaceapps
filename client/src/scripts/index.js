import '../styles/index.scss';
import * as PIXI from 'pixi.js';
import { Character } from "./character";
import { World } from "./world";
import { TextPrompt } from "./textprompt";

let app = new PIXI.Application(
    window.innerWidth,
    window.innerHeight,
    {backgroundColor : 0x1099bb}
);
document.body.appendChild(app.view);

let world = new World();
app.stage.addChild(world.container);

let character = new Character();
character.setLocation(app.renderer.width / 2, app.renderer.height / 2);
app.stage.addChild(character.container);

let uiContainer = new PIXI.Container();

let textPrompt = new TextPrompt(
    'Hello there! What the f did you just say to me I\'ll have you know that this text is going to wrap',
    0, 0, app.screen.width, 100,
    uiContainer
);

app.stage.addChild(uiContainer);

// Text prompt update
app.ticker.add(t => {
    textPrompt.ticker(t);
});

// Character position updates
app.ticker.add(t => {
    character.keyboardTick(t, world);
    app.stage.pivot.x = character.getX() - app.renderer.width/2;
    app.stage.pivot.y = character.getY() - app.renderer.height/2;

    uiContainer.x = character.getX() - app.renderer.width/2;
    uiContainer.y = character.getY() - app.renderer.height/2;
});
