import { add, remove } from './actions';
import { createStore, compose } from 'redux';
import  appstate  from './reducers';
import {getRandomInBounds, rollDie} from './utility.js'

global.PIXI = require('../node_modules/phaser-shim/dist/pixi');
global.Phaser = require('../node_modules/phaser-shim/dist/phaser');

let store = createStore(appstate,0,
  window.devToolsExtension ? window.devToolsExtension() : f => f
);

var style = { font: "20px Arial", fill: "#ff0044", align: "center" };

var screenX = 1024;
var screenY = 768;
var game = new Phaser.Game(screenX, screenY, Phaser.Canvas, 'cube-party', { preload, create, render });


function setText(text) {
  text.setText("- You have clicked -\n" + store.getState().appstate + " times !");
}

function preload(){
  //Background
  game.load.image('background', 'dist/images/wood.jpg');
  game.load.image('cups','dist/images/cups.png');
  //TilePieces
  game.load.image('tileRed','dist/images/tileRed.png');
  game.load.image('tileBlue','dist/images/tileBlue.png');
  game.load.image('tileRedStart','dist/images/tileRedStart.png');
  game.load.image('tileBlueStart','dist/images/tileBlueStart.png');
  game.load.image('tileNeutral','dist/images/tileNeutral.png');
  //dice
  game.load.spritesheet('redDice',"dist/images/DieRed.png",85,85,6);
  game.load.spritesheet('blueDice',"dist/images/DieBlue.png",85,85,6);
  //targets
  game.load.image('redTargets','dist/images/tileRedMove.png');
  game.load.image('blueTargets','dist/images/tileRedBlue.png');
}

var background;
var cupRed,cupBlue;
var cupHeight = 200;
var cupWidth = 450;
var board;
var boardHeight = 4;
var boardWidth = 6;
var tileDim = 127;
var diceDim = 85;
var endTurn;

//groups
var tiles;
var redTargets;
var blueTargets;
var redDice;
var blueDice;

var redDie;
var blueDie;

//simpleGameState
var player = 0;

function create() {
  background = game.add.image(0,0,'background');
  cupRed = game.add.image(0,screenY-cupHeight,'cups');
  cupBlue = game.add.image(screenX - cupWidth, screenY-cupHeight,"cups")

  //groups
  tiles = game.add.group();
  redTargets = game.add.group();
  blueTargets = game.add.group();
  redDice = game.add.group();
  blueDice = game.add.group();

  //draw tiles
  var col,row;
  for(col = 0; col < boardWidth; col++){
    for(row = 0; row < boardHeight; row++){
      var spriteimage = "tileNeutral";
      var spriteX = screenX/2 - ((boardWidth)/2 * tileDim) + (col * tileDim);
      var spriteY = screenY/2 - ((boardHeight/2) * tileDim) + (row * tileDim) -100;

      if (col === 0)
        spriteimage = "tileRedStart";
      else if (col === boardWidth - 1)
        spriteimage = "tileBlueStart";
      else if (col < boardWidth/2)
        spriteimage = "tileRed";
      else if (col >= boardWidth/2)
        spriteimage = "tileBlue";
      //console.log("X:" + spriteX + " Y:" +spriteY+ " S:" + spriteimage);
      tiles.create(spriteX,spriteY,spriteimage);
      if (col !== boardWidth-1){
        var temp = redTargets.create(spriteX,spriteY,"redTargets");
        temp.uniqueRef = "T" + col + row;
      }if(col !== 0){
        blueTargets.create(spriteX,spriteY,"blueTargets");
      }
    }
  }

  redTargets.alpha = 0.0;
  blueTargets.alpha = 0.0;

  //Test Die
  var startPos = getRandomInBounds(0,screenY-cupHeight,cupWidth,cupHeight);
  var x = ((startPos[0] - diceDim) < 0) ?  0 :startPos[0]- diceDim;
  var y = ((startPos[1] - diceDim) < screenY-cupHeight) ? screenY-cupHeight : startPos[1]- diceDim ;
  redDie = game.add.sprite(x,y,'redDice',0);
  console.log("sx: "+startPos[0]+" X:" + x + " sx: "+startPos[1]+" Y:" +y+ " S:");
  redDie.inputEnabled = true;
  redDie.input.enableDrag();

  redDie.events.onDragStart.add(onDragStart, this);
  redDie.events.onDragStop.add(onDragStop, this);

  //BLUE dietest
  startPos = getRandomInBounds(cupBlue.x,cupBlue.y,cupWidth,cupHeight);
  x = ((startPos[0] - diceDim) < 0) ?  0 :startPos[0]- diceDim;
  y = ((startPos[1] - diceDim) < screenY-cupHeight) ? screenY-cupHeight : startPos[1]- diceDim ;
  blueDie = game.add.sprite(x,y,'blueDice',3);
  console.log("sx: "+startPos[0]+" X:" + x + " sx: "+startPos[1]+" Y:" +y+ " S:");
  blueDie.inputEnabled = true;
  blueDie.input.enableDrag();

  blueDie.events.onDragStart.add(onDragStart, this);
  blueDie.events.onDragStop.add(onDragStop, this);
  blueDie.input.draggable = false;//disabled by default

  //End Turn Button
  endTurn = game.add.text(game.world.centerX-10,screenY - cupHeight/2, "End Turn",style);
  endTurn.inputEnabled = true;

  endTurn.events.onInputDown.add(() => {
    endPlayerTurn()
  });
}

function endPlayerTurn(){
  toggleDieInput(player,false);
  player++;
  player = player % 2;
  toggleDieInput(player,true);
}

function toggleDieInput(player,set){
  if(player === 0)
    redDie.input.draggable = set;
  else {
    blueDie.input.draggable = set;
  }
}

var lastDragStartX;
var lastDragStartY;

function onDragStart(sprite, pointer) {
    lastDragStartX = sprite.x;
    lastDragStartY = sprite.y;
    if (player === 0){
      redTargets.alpha = 0.5;
    }else {
      blueTargets.alpha = 0.5;
    }
}

function onDragStop(sprite, pointer) {
  redTargets.alpha = 0.0;
  blueTargets.alpha = 0.0;

  if(overLap(sprite.x,sprite.y,diceDim,diceDim,screenX/2 - ((boardWidth)/2 * tileDim),screenY/2 - ((boardHeight/2) * tileDim) -100,screenX/2 - ((boardWidth)/2 * tileDim) + (boardWidth * tileDim),screenY/2 - ((boardHeight/2) * tileDim) + (boardHeight * tileDim) -100)){  //draw tiles
    var col,row;
    for(col = 0; col < boardWidth; col++){
      for(row = 0; row < boardHeight; row++){
        var spriteX = screenX/2 - ((boardWidth)/2 * tileDim) + (col * tileDim);
        var spriteY = screenY/2 - ((boardHeight/2) * tileDim) + (row * tileDim) -100;
        if(overLap(sprite.x,sprite.y,diceDim,diceDim,spriteX,spriteY,tileDim,tileDim)){
          sprite.x = spriteX + (tileDim-diceDim)/2;
          sprite.y = spriteY + (tileDim-diceDim)/2;
          sprite.col = col;
          sprite.row = row;
          return;
        }
      }
    }

  }
  if (player == 0){
  if(!overLap(sprite.x,sprite.y,diceDim,diceDim,cupRed.x,cupRed.y,cupWidth,cupHeight)){
      sprite.x = lastDragStartX;
      sprite.y = lastDragStartY;
  }
  }else{
    if(!overLap(sprite.x,sprite.y,diceDim,diceDim,cupBlue.x,cupBlue.y,cupWidth,cupHeight)){
        sprite.x = lastDragStartX;
        sprite.y = lastDragStartY;
    }
  }
}

function inBounds(x,y,w,h,bx,by,bw,bh){
  return !(
    x+w < bx ||
    y+h < by ||
    x > bx+bw ||
    y > by+bh
  );
}

function overLap(x,y,w,h,bx,by,bw,bh){
  return (
    x+w < bx+bw &&
    y+h < by+bh &&
    x > bx &&
    y > by
  );
}

function render() {

}
