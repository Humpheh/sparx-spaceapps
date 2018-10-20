import '../styles/index.scss';
import * as PIXI from 'pixi.js';
import yaml from "js-yaml";

import { Character } from "./character";
import EE, {
    E_ENTITY_DISPATCH_ACTIONS,
} from "./events";
import { WorldContainer } from "./world";
import { ActionEventHandler } from "./actionEvents";
import { Slide } from "./slide";

const DEFAULT_WORLD_ID = 1;

function getBackground(texture, width, height) {
    let tilingBackground = new PIXI.extras.TilingSprite(
        texture, width, height
    );
    tilingBackground.anchor.set(0.5);
    tilingBackground.tileScale.set(0.5);
    return tilingBackground;
}

export const GameApp = new PIXI.Application(
    window.innerWidth,
    window.innerHeight,
    {backgroundColor: 0x1099bb}
);

function start(loader, resources) {
    console.log(resources);
    document.body.appendChild(GameApp.view);

    let background = getBackground(
        resources['sea_background'].texture,
        window.innerWidth * 10,
        window.innerHeight * 10
    );
    GameApp.stage.addChild(background);

    let worldContainer = new WorldContainer(DEFAULT_WORLD_ID);
    GameApp.stage.addChild(worldContainer.container);

    let character = new Character();
    // character.setLocation(GameApp.renderer.width / 2, GameApp.renderer.height / 2);
    GameApp.stage.addChild(character.container);

    let uiContainer = new PIXI.Container();

    let eventHandler = new ActionEventHandler(GameApp.screen.width, GameApp.screen.height, uiContainer);
    EE.on(E_ENTITY_DISPATCH_ACTIONS, (context) => { eventHandler.runEvents(context, () => {}); });

    GameApp.stage.addChild(uiContainer);

    // Text prompt update
    GameApp.ticker.add(t => {
        eventHandler.ticker(t);
    });

    let par = PIXI.loader.resources['vignette'].texture;
    let vignette = new PIXI.Sprite(par);
    vignette.width = GameApp.renderer.width;
    vignette.height = GameApp.renderer.height;
    GameApp.stage.addChild(vignette);

    // Character position updates
    GameApp.ticker.add(t => {
        worldContainer.world.ticker(t, character);
        character.keyboardTick(t, worldContainer.world);
        GameApp.stage.pivot.x = character.getX() - GameApp.renderer.width / 2;
        GameApp.stage.pivot.y = character.getY() - GameApp.renderer.height / 2;

        let xx = character.getX() - GameApp.renderer.width / 2;
        let yy = character.getY() - GameApp.renderer.height / 2;
        uiContainer.x = xx;
        uiContainer.y = yy;
        vignette.x = xx;
        vignette.y = yy;
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
        .add('fakeslide_1', 'public/assets/slides/fakeslide_1.png')
        .add('vignette', 'public/assets/vignette.png')
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
