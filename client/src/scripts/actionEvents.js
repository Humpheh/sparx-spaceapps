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

        // every event stream invocation gets a key issued from this
        // monotonically-increasing counter. We can use the key to verify a
        // stream should continue. When events should abort, we drop all the
        // currently-running event streams and future callbacks should quite
        // early.
        this.currentEventKey = 0;

        this.tickers = [];

        // the list of current running event keys. List because event streams
        // can be nested.
        this.currentEventKeys = [];

        this.queueEvents = false;
        this.eventQueue = new EventQueue();

        EE.on(E_ABORT_EVENT_FLOW, () => {
            this.currentEventKeys = [];
        });
        EE.on(E_START_QUEUING_EVENTS, () => {
            this.queueEvents = true;
        });
        EE.on(E_STOP_QUEUING_EVENTS, () => {
            this.queueEvents = false;
            this.abortingFlow = false;
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
    _runEvents(eventSpec, onDone, key) {
        EE.emit(E_SET_WORLD_LOCK, true);

        if (this.currentEventKeys.indexOf(key) <= -1) {
            this.currentEventKeys.push(key);
        }

        let events = this.loadEvents(eventSpec);
        let doEvent = (index) => {
            console.log('EVENT:', events[index]);
            const shouldAbort = this._shouldAbortEvent(key);
            if (!events[index] || shouldAbort) {
                EE.emit(E_SET_WORLD_LOCK, false);
                onDone(shouldAbort);
                return;
            }
            events[index](() => doEvent(index+1));
        };
        doEvent(0);
    }

    _getEventKey() {
        return this.currentEventKey++;
    }

    _shouldAbortEvent(key) {
        return this.currentEventKeys.indexOf(key) == -1;
    }

    runEvents(eventSpec, onDone) {
        if (this.queueEvents) {
            this.eventQueue.queueEvents(eventSpec, onDone);
            return;
        }
        this._runEvents(eventSpec, onDone, this._getEventKey());
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
        case 'delay':
            return this.newDelayEventsFlow(event);
        }
        return null;
    }

    newCheck(event) {
        return (onFinish) => {
            let ok = this.worldContainer.doCheck(event.key, event.check, event.case);
            if (!ok) {
                this._runEvents(event.events, onFinish, this._getEventKey());
            } else {
                onFinish();
            }
        };
    }

    newDelayEventsFlow(event) {
        return (finishCallback) => {
            let alreadyFinished = false;
            let onFinish = () => {
                (!alreadyFinished) && finishCallback();
                alreadyFinished = true;
            };

            let callback = () => {
                if (event.events) {
                    this._runEvents(event.events, () => {}, this._getEventKey());
                }
                onFinish();
            };

            if (event.async) {
                // Surprise! We're async. Dispatch the "finish" event
                // immediately so we move to the next one
                onFinish();
            }

            window.setTimeout(callback, event.content * 1000);
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
                event, this.uiContainer, finishHandler,
                event.speaker_name
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
                    this._runEvents(events, done, this._getEventKey());
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
