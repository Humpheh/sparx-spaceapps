import Config from "./config";
import { KeyboardEventHandler, KEY_ESCAPE } from "./keyboard";
import { TextPrompt } from "./textprompt";
import EE, {
    E_ABORT_EVENT_FLOW, E_RUN_EVENTS, E_SET_WORLD_LOCK,
    E_START_QUEUING_EVENTS, E_STOP_QUEUING_EVENTS
} from "./events";
import { Slide } from "./slide";

class EventQueue {
    constructor() {
        this.eventQueue = [];
    }

    queueEvents(eventSpec, onDone) {
        this.eventQueue.push({
            'eventSpec': eventSpec,
            'onDone': onDone
        });
    }

    dispatchQueuedEvents(dispatcher) {
        let queuedEvents = this.eventQueue;
        this.eventQueue = [];
        for (let ev of queuedEvents) {
            dispatcher(ev.eventSpec, ev.onDone);
        }
    }
}

export class ActionEventHandler {
    constructor(w, h, uiContainer, worldContainer) {
        this.worldWidth = w;
        this.worldHeight = h;
        this.uiContainer = uiContainer;
        this.worldContainer = worldContainer;

        this.tickers = [];

        // Set to true if the event flow is to be aborted for the current run
        this.abortingFlow = false;

        // We need to know we are actually in events we can abort. If not we
        // will abort the next attempted run of the events (e.g. when the next
        // collision occurs).
        this.eventsActive = false;

        this.queueEvents = false;
        this.eventQueue = new EventQueue();

        EE.on(E_ABORT_EVENT_FLOW, () => {
            if (this.eventsActive && !this.queueEvents) {
                this.abortingFlow = true;
            }
        });
        EE.on(E_START_QUEUING_EVENTS, () => {
            this.queueEvents = true;
        });
        EE.on(E_STOP_QUEUING_EVENTS, () => {
            this.queueEvents = false;
            this._dispatchQueuedEvents();
        });

        EE.on(E_RUN_EVENTS, (data, onDone) => {
            this.runEvents(data, onDone);
        });

        // Allow the ESC key to abort event flow prematurely when debug mode is
        // active
        new KeyboardEventHandler(
            KEY_ESCAPE,
            () => {
                console.log("got escape key");
                Config.debug && EE.emit(E_ABORT_EVENT_FLOW);
            }
        ).bindListeners();
    }

    // Internal event runner, bypasses the queue
    _runEvents(eventSpec, onDone) {
        EE.emit(E_SET_WORLD_LOCK, true);

        this.eventsActive = true;
        let events = this.loadEvents(eventSpec);
        let doEvent = (index) => {
            console.log('EVENT:', events[index]);
            if (!events[index] || this.abortingFlow) {
                EE.emit(E_SET_WORLD_LOCK, false);
                onDone(this.abortingFlow);
                this.abortingFlow = false;
                this.eventsActive = false;
                return;
            }
            events[index](() => doEvent(index+1));
        };
        doEvent(0);
    }

    runEvents(eventSpec, onDone) {
        if (this.queueEvents) {
            this.eventQueue.queueEvents(eventSpec, onDone);
            return;
        }
        this._runEvents(eventSpec, onDone);
    }

    _dispatchQueuedEvents() {
        this.eventQueue.dispatchQueuedEvents(this._runEvents.bind(this));
    }

    loadEvents(eventSpec) {
        let eventChain = [];
        for (let event of eventSpec) {
            let eventHandler = this.makeEventHandler(event);
            if (eventHandler) {
                eventChain.push(eventHandler);
            } else {
                console.error('unknown event handler:', eventHandler);
            }
        }
        return eventChain;
    }

    makeEventHandler(event) {
        switch (event.type) {
        case 'text':
            return this.newTextHandler(event);
        case 'slide':
            return this.newSlideHandler(event);
        case 'event':
            return this.newEventDispatcher(event);
        case 'check':
            return this.newCheck(event);
        case 'quit':
                return this.newQuitEventFlow(event);
        }
        return null;
    }

    newCheck(event) {
        return (onFinish) => {
            let ok = this.worldContainer.doCheck(event.key, event.check, event.case);
            if (!ok) {
                this._runEvents(event.events, onFinish);
            } else {
                onFinish();
            }
        };
    }

    newTextHandler(event) {
        return (onFinish) => {
            let prompt;
            let finishHandler = () => {
                const index = this.tickers.indexOf(prompt);
                this.tickers.splice(index, 1);
                onFinish();
            };
            prompt = new TextPrompt(
                event.text,
                0, this.worldHeight - 200, this.worldWidth, 200,
                event, this.uiContainer, finishHandler
            );
            this.tickers.push(prompt);
            return prompt;
        };
    }

    newSlideHandler(event) {
        return (onFinish) => {
            let slide;
            let finishHandler = (events, done) => {
                if (!events) {
                    const index = this.tickers.indexOf(slide);
                    this.tickers.splice(index, 1);
                    onFinish();
                } else {
                    this._runEvents(events, done);
                }
            };
            slide = new Slide(
                event.image, this.uiContainer, this.worldContainer,
                event, finishHandler
            );
            this.tickers.push(slide);
            return slide;
        };
    }

    newEventDispatcher(event) {
        return (onFinish) => {
            EE.emit(event.event, event.content);
            onFinish();
        };
    }

    newQuitEventFlow(event) {
        return (onFinish) => {
            EE.emit(E_ABORT_EVENT_FLOW);
            onFinish();
        };
    }

    ticker(delta) {
        for (let ticker of this.tickers) {
            ticker.ticker(delta);
        }
    }
}
