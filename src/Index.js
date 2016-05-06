import { add, remove } from './actions';
import { createStore, compose } from 'redux';
import  appstate  from './reducers';

global.PIXI = require('../node_modules/phaser-shim/dist/pixi');
global.Phaser = require('../node_modules/phaser-shim/dist/phaser');

let store = createStore(appstate,0,
  window.devToolsExtension ? window.devToolsExtension() : f => f
);

var style = { font: "65px Arial", fill: "#ff0044", align: "center" };

var game = new Phaser.Game(800, 600, Phaser.Canvas, 'cube-party', { create });


function setText(text) {
  text.setText("- You have clicked -\n" + store.getState().appstate + " times !");
}

function create() {
  let text = game.add.text(game.world.centerX,game.world.centerY, "hello",style);
  text.anchor.set(0.5);
  text.inputEnabled = true;
  text.input.enableDrag();

  store.subscribe(setText.bind(null,text));

  text.events.onInputDown.add(() => {
    store.dispatch(add())
  });
}
