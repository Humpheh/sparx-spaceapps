import EventEmitter from 'eventemitter3';
import Config from "./config";

export const E_PLAYER_MOVED = 'PLAYER_MOVED';
export const E_SET_WORLD_LOCK = 'SET_WORLD_LOCK';

let EE = new EventEmitter();

function addDebugLogger(event) {
    EE.on(event, () => {
        console.log('Received event: ' + event);
    });
}

if (Config.debug) {
    addDebugLogger(E_PLAYER_MOVED);
}

export default EE;
