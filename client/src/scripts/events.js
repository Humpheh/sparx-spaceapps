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
export const E_GO_TO_WORLD = 'GO_TO_WORLD';
export const E_ABORT_EVENT_FLOW = 'ABORT_EVENT_FLOW';
export const E_START_QUEUING_EVENTS = 'START_QUEUING_EVENTS';
export const E_STOP_QUEUING_EVENTS = 'STOP_QUEUING_EVENTS';
export const E_ADD_HUNGER = 'ADD_HUNGER';
export const E_RUN_EVENTS = 'RUN_EVENTS';
export const E_SET_WEATHER_INTENSITY = 'SET_WEATHER_INTENSITY';
export const E_ADD_BACKPACK_ITEM = 'ADD_BACKPACK_ITEM';
export const E_DID_UPDATE_BACKPACK_CONTENTS = 'DID_UPDATE_BACKPACK_CONTENTS';

let EE = new EventEmitter();

function addDebugLogger(event) {
    EE.on(event, () => {
        console.log('Received event: ' + event);
    });
}

if (Config.debug) {
    addDebugLogger(E_SET_WORLD_LOCK);
    addDebugLogger(E_ENTITY_DISPATCH_ACTIONS);
    addDebugLogger(E_DESTROY_ENTITY);
    addDebugLogger(E_SET_GLOBAL);
    addDebugLogger(E_INC_GLOBAL);
    addDebugLogger(E_APPEND_GLOBAL);
    addDebugLogger(E_DEPEND_GLOBAL);
    addDebugLogger(E_GO_TO_WORLD);
    addDebugLogger(E_ABORT_EVENT_FLOW);
    addDebugLogger(E_START_QUEUING_EVENTS);
    addDebugLogger(E_STOP_QUEUING_EVENTS);
    addDebugLogger(E_ADD_HUNGER);
    addDebugLogger(E_RUN_EVENTS);
    addDebugLogger(E_SET_WEATHER_INTENSITY);
    addDebugLogger(E_ADD_BACKPACK_ITEM);
    addDebugLogger(E_DID_UPDATE_BACKPACK_CONTENTS);
}

export default EE;
