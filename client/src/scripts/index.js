import '../styles/index.scss';
import * as PIXI from 'pixi.js';
import yaml from "js-yaml";

import { Character } from "./character";
import EE, {
    E_ENTITY_DISPATCH_ACTIONS,
} from "./events";
import { WorldContainer } from "./world";
import { ActionEventHandler } from "./actionEvents";

const DEFAULT_WORLD_ID = 1;

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

    let worldContainer = new WorldContainer(DEFAULT_WORLD_ID);
    app.stage.addChild(worldContainer.container);

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
        worldContainer.world.ticker(t, character);
        character.keyboardTick(t, worldContainer.world);
        app.stage.pivot.x = character.getX() - app.renderer.width / 2;
        app.stage.pivot.y = character.getY() - app.renderer.height / 2;

        uiContainer.x = character.getX() - app.renderer.width / 2;
        uiContainer.y = character.getY() - app.renderer.height / 2;
    });

    window.setWorld = (worldId) => { worldContainer.setWorld(worldId); };
}

function loadRootAssets() {
    PIXI.loader
        .add('sea_background', 'public/assets/sea.png')
        .add('public/assets/penguin/penguin2.json')
        .add('scratchcat', 'public/assets/sprites/scratchcat.png')
        .add('iceicebaby', 'public/assets/sprites/iceicebaby.jpg')
        .add('tuxside', 'public/assets/penguin/tux_side.png')
        .load(start);
}

let worldLoader = new PIXI.loaders.Loader();
worldLoader.add('worlds', 'public/assets/worlds/worlds.yaml');
worldLoader.load((loader, resources) => {
    const worlds = yaml.safeLoad(resources['worlds'].data);
    for (let world of worlds) {
        PIXI.loader
            .add('world' + world + '_spec', 'public/assets/worlds/world' + world + '.yaml')
            .add('world' + world + '_tiles', 'public/assets/worlds/world' + world + '.csv');
    }
});
worldLoader.onComplete.add(() => { loadRootAssets(); });
