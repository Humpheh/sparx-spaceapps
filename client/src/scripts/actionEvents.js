import { TextPrompt } from "./textprompt";
import EE, { E_SET_WORLD_LOCK } from "./events";

export class ActionEventHandler {
    constructor(w, h, uiContainer) {
        this.worldWidth = w;
        this.worldHeight = h;
        this.uiContainer = uiContainer;

        this.tickers = [];
    }

    runEvents(eventSpec, onDone) {
        EE.emit(E_SET_WORLD_LOCK, true);
        let events = this.loadEvents(eventSpec);
        let doEvent = function(index) {
            console.log('EVENT:', events[index]);
            if (!events[index]) {
                EE.emit(E_SET_WORLD_LOCK, false);
                onDone();
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
        }
        return null;
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
                0, this.worldHeight - 150, this.worldWidth, 150,
                this.uiContainer, finishHandler
            );
            this.tickers.push(prompt);
            return prompt;
        };
    }

    ticker(delta) {
        for (let ticker of this.tickers) {
            ticker.ticker(delta);
        }
    }
}