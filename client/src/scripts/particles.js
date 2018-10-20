import * as PIXI from "pixi.js";
import {Emitter} from "pixi-particles";
import { GameApp } from "./index";

export function newSnow(container) {
// Create a new emitter
    let emitter = new Emitter(
        container,
        [PIXI.loader.resources['snow'].texture],

        // Emitter configuration, edit this to change the look
        // of the emitter
        {
            "alpha": {
                "start": 1,
                "end": 0
            },
            "scale": {
                "start": 0.2,
                "end": 0.2,
                "minimumScaleMultiplier": 1
            },
            "color": {
                "start": "#ffffff",
                "end": "#ffffff"
            },
            "speed": {
                "start": 50,
                "end": 50,
                "minimumSpeedMultiplier": 0.001
            },
            "acceleration": {
                "x": 0,
                "y": 0
            },
            "maxSpeed": 0,
            "startRotation": {
                "min": 40,
                "max": 50
            },
            "noRotation": true,
            "rotationSpeed": {
                "min": 0,
                "max": 0
            },
            "lifetime": {
                "min": 3,
                "max": 6
            },
            "blendMode": "normal",
            "frequency": 0.01,
            "emitterLifetime": -1,
            "maxParticles": 500,
            "pos": {
                "x": 0,
                "y": 0
            },
            "addAtBack": false,
            "spawnType": "rect",
            "spawnRect": {
                "x": 0,
                "y": 0,
                "w": GameApp.renderer.width,
                "h": GameApp.renderer.height
            }
        }
    );

    // Start emitting
    emitter.emit = true;

    let time = 1000;

    // Update function every frame
    return function (delta) {
        time += delta;

        // The emitter requires the elapsed
        // number of seconds since the last update
        emitter.update(time * 0.0001);
    };
}