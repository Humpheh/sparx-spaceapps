import EventEmitter from 'eventemitter3';
import Config from "./config";

export const E_PLAYER_MOVED = 'PLAYER_MOVED';
export const E_SET_WORLD_LOCK = 'SET_WORLD_LOCK';
export const E_ENTITY_DISPATCH_ACTIONS = 'ENTITY_DISPATCH_ACTIONS';
export const E_DESTROY_ENTITY = 'DESTROY_ENTITY';
export const E_SET_GLOBAL = 'SET_GLOBAL';
export const E_INC_GLOBAL = 'INC_GLOBAL';
export const E_APPEND_GLOBAL = 'APPEND_GLOBAL';
export const E_DEPEND_GLOBAL = 'DEPEND_GLOBAL';

let EE = new EventEmitter();

function addDebugLogger(event) {
    EE.on(event, () => {
        console.log('Received event: ' + event);
    });
}

if (Config.debug) {
    addDebugLogger(E_PLAYER_MOVED);
    addDebugLogger(E_SET_WORLD_LOCK);
    addDebugLogger(E_ENTITY_DISPATCH_ACTIONS);
}

export default EE;
