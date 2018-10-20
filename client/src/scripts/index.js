import '../styles/index.scss';
import * as PIXI from 'pixi.js';
import { Character } from "./character";
import EE, {
    E_ENTITY_DISPATCH_ACTIONS,
} from "./events";
import { World } from "./world";
import { ActionEventHandler } from "./actionEvents";

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

let eventHandler = new ActionEventHandler(app.screen.width, app.screen.height, uiContainer);
EE.on(E_ENTITY_DISPATCH_ACTIONS, (context) => { eventHandler.runEvents(context, () => {}); });

app.stage.addChild(uiContainer);

// Text prompt update
app.ticker.add(t => {
    eventHandler.ticker(t);
});

// Character position updates
app.ticker.add(t => {
    character.keyboardTick(t, world);
    app.stage.pivot.x = character.getX() - app.renderer.width/2;
    app.stage.pivot.y = character.getY() - app.renderer.height/2;

    uiContainer.x = character.getX() - app.renderer.width/2;
    uiContainer.y = character.getY() - app.renderer.height/2;
});
