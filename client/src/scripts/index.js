import '../styles/index.scss';
import * as PIXI from 'pixi.js';
import yaml from "js-yaml";

import { Character } from "./character";
import EE, {
    E_ENTITY_DISPATCH_ACTIONS,
    E_GO_TO_WORLD,
    E_PLAYER_MOVED, E_SET_WEATHER_INTENSITY,
} from "./events";
import { WorldContainer, tileToGlobal } from "./world";
import { ActionEventHandler } from "./actionEvents";
import { Slide } from "./slide";

import { LOCAL_DEFAULT_WORLD_ID } from "./localsettings";
import { HungerMeter } from "./hunger";
import { newSnow } from "./particles";

const DEFAULT_WORLD_ID = LOCAL_DEFAULT_WORLD_ID || 4;

function getBackground(texture, width, height) {
    let tilingBackground = new PIXI.extras.TilingSprite(
        texture, width, height
    );
    tilingBackground.anchor.set(0.5);
    tilingBackground.tileScale.set(0.5);
    return tilingBackground;
}

function getClouds(texture, width, height) {
    let tilingBackground = new PIXI.extras.TilingSprite(
        texture, width, height
    );
    tilingBackground.anchor.set(0.5);
    tilingBackground.tileScale.set(2);
    tilingBackground.alpha = 0.2;

    EE.on(E_SET_WEATHER_INTENSITY, intensity => {
        tilingBackground.alpha = intensity;
    });

    // console.log(PIXI.BLEND_MODES);
    tilingBackground.blendMode = PIXI.BLEND_MODES['SCREEN'];
    return tilingBackground;
}

export const GameApp = new PIXI.Application(
    1024,//window.innerWidth,
    768,//window.innerHeight,
    {backgroundColor: 0x1099bb}
);

function initGame(loader, resources) {
    console.log(resources);
    document.body.appendChild(GameApp.view);

    let background = getBackground(
        resources['sea_background'].texture,
        window.innerWidth * 10,
        window.innerHeight * 10
    );
    GameApp.stage.addChild(background);
    let bgTicker = 0;
    GameApp.ticker.add(t => {
        bgTicker += t;
        background.x = Math.sin(bgTicker/200) * 32;
        background.y = Math.cos(bgTicker/125) * 32;

        background.scale.x = 1 + Math.sin(bgTicker/500) * 0.04;
        background.scale.y = 1 + Math.cos(bgTicker/400) * 0.04;
    });

    let worldContainer = new WorldContainer();
    GameApp.stage.addChild(worldContainer.container);

    let character = new Character();
    GameApp.stage.addChild(character.container);

    worldContainer.registerWorldChangeCallback((world) => {
        const startingPosition = world.getStartingPosition();
        character.setLocation(
            tileToGlobal(startingPosition.x),
            tileToGlobal(startingPosition.y)
        );
    });
    worldContainer.registerWorldChangeCallback((_, worldContainer) => {
        let { x, y } = character.getLocation();
        worldContainer.doDetectCollisions(x, y);
    });

    // Add the clouds
    let clouds = getClouds(
        resources['cloud'].texture,
        window.innerWidth * 10,
        window.innerHeight * 10
    );
    GameApp.stage.addChild(clouds);

    let uiContainer = new PIXI.Container();

    let snowEmitter = newSnow(uiContainer);
    GameApp.ticker.add(snowEmitter);

    let hungerMeter = new HungerMeter();
    uiContainer.addChild(hungerMeter.getComponent());

    let eventHandler = new ActionEventHandler(
        GameApp.screen.width,
        GameApp.screen.height,
        uiContainer,
        worldContainer
    );
    EE.on(E_ENTITY_DISPATCH_ACTIONS, (context) => { eventHandler.runEvents(context, () => {}); });
    EE.on(E_PLAYER_MOVED, (context) => worldContainer.doDetectCollisions(context.x, context.y));

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

    window.setWorld = (worldId) => { EE.emit(E_GO_TO_WORLD, worldId); };
}

function start() {
    EE.emit(E_GO_TO_WORLD, DEFAULT_WORLD_ID);
}

function loadRootAssets() {
    PIXI.loader
        .add('sea_background', 'public/assets/sea.png')
        .add('public/assets/penguin/penguin2.json')
        .add('scratchcat', 'public/assets/sprites/scratchcat.png')
        .add('berg', 'public/assets/sprites/berg.png')
        .add('fish', 'public/assets/sprites/fish.png')
        .add('berg_big', 'public/assets/sprites/berg_big.png')
        .add('walrus', 'public/assets/sprites/walrus.png')
        .add('iceicebaby', 'public/assets/sprites/iceicebaby.jpg')
        .add('tuxside', 'public/assets/penguin/tux_side.png')
        .add('walrusside', 'public/assets/penguin/walrus_side.png')
        .add('water_slide', 'public/assets/slides/water_slide.png')
        .add('snow_slide', 'public/assets/slides/snow_slide.png')
        .add('world_map', 'public/assets/slides/world_map.jpg')
        .add('select_items', 'public/assets/slides/select_items.png')
        .add('vignette', 'public/assets/vignette.png')
        .add('snow', 'public/assets/particles/snow.png')
        .add('cloud', 'public/assets/particles/cloud.png')
        .add('ice_1_slide', 'public/assets/slides/ice_1_slide.png')
        .add('ice_2_slide', 'public/assets/slides/ice_2_slide.png')
        .load((loader, resources) => {
            initGame(loader, resources);
            start();
        });
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
