import * as actions from './actions';
import { createStore, compose } from 'redux';
import  appstate  from './reducers';
import { DiceConst, CombatConst } from './Constants'
global.PIXI = require('../node_modules/phaser-shim/dist/pixi');
global.Phaser = require('../node_modules/phaser-shim/dist/phaser');

let store = createStore(appstate,{},
  window.devToolsExtension ? window.devToolsExtension() : f => f
);

var style = { font: "65px Arial", fill: "#ff0044", align: "center" };

var game = new Phaser.Game(800, 600, Phaser.Canvas, 'cube-party', { create, preload });

function setText(text) {


  text.loadTexture('blueDice',store.getState().appstate % 6)
}

function preload() {
  game.load.spritesheet('blueDice', 'dist/images/DieBlue.png', 85,85,6);
}

function setInitialOptions() {
  store.dispatch(actions.setBonusDiceVariety(DiceConst.BonusVariety.Pairs));
  store.dispatch(actions.setMovementVariety(DiceConst.MovementVariety.Simultaneous));
  store.dispatch(actions.setDiceRollTiming(DiceConst.RollTiming.Round));
  store.dispatch(actions.setCombatTradingVariety(CombatConst.TradingVariety.GT));
  store.dispatch(actions.setCombatTradingResult(CombatConst.TradingResult.Subtract));
  store.dispatch(actions.setBoardSize(6,4));
  store.dispatch(actions.setDiceCount(4));
  store.dispatch(actions.setBonusDiceCount(2));
}

function create() {
  setInitialOptions();
  let text = game.add.text(game.world.centerX,game.world.centerY, "hello",style);
  let dice = game.add.sprite(20,20,'blueDice',0);
  store.subscribe(setText.bind(null,dice));


  text.anchor.set(0.5);
  text.inputEnabled = true;
  text.input.enableDrag();


  text.events.onInputDown.add(() => {
    store.dispatch(actions.add())
  });
}
