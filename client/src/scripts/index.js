import '../styles/index.scss';
import { Application } from 'pixi.js';

let app = new Application(
    document.body.clientWidth,
    document.body.clientHeight,
    {backgroundColor : 0x1099bb}
);
document.body.appendChild(app.view);

// create a new Sprite from an image path
let bunny = PIXI.Sprite.fromImage('public/assets/spx_X_white.jpg');

// center the sprite's anchor point
bunny.anchor.set(0.5);

// move the sprite to the center of the screen
bunny.x = app.screen.width / 2;
bunny.y = app.screen.height / 2;

app.stage.addChild(bunny);

// Listen for animate update
app.ticker.add(function(delta) {
    // just for fun, let's rotate mr rabbit a little
    // delta is 1 if running at 100% performance
    // creates frame-independent transformation
    bunny.rotation += 0.1 * delta;
});
