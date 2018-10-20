import '../styles/index.scss';
import * as PIXI from 'pixi.js';
import { Character } from "./character";
import EE, {
    E_ENTITY_DISPATCH_ACTIONS,
} from "./events";
import { World } from "./world";
import { ActionEventHandler } from "./actionEvents";

function getBackground(texture, width, height) {
    let tilingBackground = new PIXI.extras.TilingSprite(
        texture, width, height
    );
    tilingBackground.anchor.set(0.5);
    tilingBackground.tileScale.set(0.5);
    return tilingBackground;
}

function start(loader, resources) {
    console.log(resources);
    let app = new PIXI.Application(
        window.innerWidth,
        window.innerHeight,
        {backgroundColor: 0x1099bb}
    );
    document.body.appendChild(app.view);

    let background = getBackground(
        resources['sea_background'].texture,
        window.innerWidth * 10,
        window.innerHeight * 10
    );
    app.stage.addChild(background);

    let world = new World();
    app.stage.addChild(world.container);

    let character = new Character();
    // character.setLocation(app.renderer.width / 2, app.renderer.height / 2);
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
        world.ticker(t, character);
        character.keyboardTick(t, world);
        app.stage.pivot.x = character.getX() - app.renderer.width / 2;
        app.stage.pivot.y = character.getY() - app.renderer.height / 2;

        uiContainer.x = character.getX() - app.renderer.width / 2;
        uiContainer.y = character.getY() - app.renderer.height / 2;
    });
}

PIXI.loader
    .add('sea_background', 'public/assets/sea.png')
    .add('world1_spec', 'public/assets/worlds/world1.yaml')
    .add('world1_tiles', 'public/assets/worlds/world1.csv')
    .add('public/assets/penguin/penguin2.json')
    .add('scratchcat', 'public/assets/sprites/scratchcat.png')
    .load(start);
