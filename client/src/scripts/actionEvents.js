import { TextPrompt } from "./textprompt";
import EE, { E_ABORT_EVENT_FLOW, E_SET_WORLD_LOCK } from "./events";
import { Slide } from "./slide";

export class ActionEventHandler {
    constructor(w, h, uiContainer, worldContainer) {
        this.worldWidth = w;
        this.worldHeight = h;
        this.uiContainer = uiContainer;
        this.worldContainer = worldContainer;

        this.tickers = [];

        // Set to true if the event flow is to be aborted for the current run
        this.abortingFlow = false;
        this.eventsActive = false;

        EE.on(E_ABORT_EVENT_FLOW, () => {
            if (this.eventsActive) {
                this.abortingFlow = true;
            }
        });
    }

    runEvents(eventSpec, onDone) {
        EE.emit(E_SET_WORLD_LOCK, true);
        this.eventsActive = true;
        let events = this.loadEvents(eventSpec);
        let doEvent = (index) => {
            console.log('EVENT:', events[index]);
            if (!events[index] || this.abortingFlow) {
                EE.emit(E_SET_WORLD_LOCK, false);
                onDone();
                this.abortingFlow = false;
                this.eventsActive = false;
                return;
            }
            events[index](() => doEvent(index+1));
        };
        doEvent(0);
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
                this.runEvents(event.events, onFinish);
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
                    this.runEvents(events, done);
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
