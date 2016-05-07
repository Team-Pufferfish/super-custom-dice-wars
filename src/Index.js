import {getRandomInBounds, rollDie} from './utility.js'
import _ from 'lodash';

var settingsConstants = {
  placementStrategy: {
    behindAny: "Any free spot behind a friendly die",
    behindOne: "First free spot behind a friendly die",
    reinforceLineOne: "First free spot behind center line",
    reinforceLineAny: "Any free spot behind center line",
    homeRowOnly: "Only in base"
  }
}


global.PIXI = require('../node_modules/phaser-shim/dist/pixi');
global.Phaser = require('../node_modules/phaser-shim/dist/phaser');


var styleRed = { font: "20px Arial", fill: "#ff0044", align: "center" };
var styleBlue = { font: "20px Arial", fill: "#0044FF", align: "center" };

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
var placementStrategy = settingsConstants.placementStrategy.reinforceLineAny;
var playerDiceCount = 4;
var playerBonusDiceCount = 2;

//groups
var tiles;
var redTargets;
var blueTargets;
var redDiceInHand;
var blueDiceInHand;

var blueDiceOnBoard;
var redDiceOnBoard;

//simpleGameState
var player = 0;

function reroll(player){

  var playerHand = player === 0 ? redDiceInHand : blueDiceInHand;

  playerHand.forEach((die) => {
    let diceValue = rollDie();

    var texture = die.key;

    die.value = diceValue;
    die.loadTexture(texture,diceValue - 1);
  });

}

function posToRowHeight(pos){
  //sprite.pos = boardWidth * row + col;
  return {
    col: pos % boardWidth,
    row: Math.floor(pos / boardWidth)
  }
}
//18 0,4
function rowColToPos(row,col){
  return boardWidth * row + col;
}

function getAllPositionsInRow(pos){
  let {row,col} = posToRowHeight(pos);
  return _.range(pos-col,pos-col + boardWidth);
}

function isPlayableSpot(playerID, row, col){
  var playableSpots = getPlayableSpots(playerID);

  return playableSpots(rowColToPos(row, col)) === 1;

}

function getPlayableSpots(playerID){

  //your board and enemy board
  var board = playerID === 0 ? redDiceOnBoard : blueDiceOnBoard;
  var enemyBoard = playerID === 1 ? redDiceOnBoard : blueDiceOnBoard;

  //base row
  var homeRow = playerID === 0 ? 0 : boardWidth - 1;
  let playableSpots = [];
  for (let i = 0; i < boardHeight * boardWidth; i++ ){
    playableSpots.push(1);
  }
  
  //remove everything except the home row, this is the default strategy
  for (let i = 0; i < playableSpots.length; i++){
    if (posToRowHeight(i).col !== homeRow) {
      playableSpots[i] = 0;
    }
  }

  //add full board positions
  board.forEach((elem) => {
      playableSpots[elem.pos] = 0; //remove the position of the dice itself
      var row = getAllPositionsInRow(elem.pos);
      var reinforceLine = row[Math.ceil(boardWidth / 2)];

      if (playerID === 1) reinforceLine -= 1;

      var filterStrategy;

      if (placementStrategy === settingsConstants.placementStrategy.behindAny) {
         if (playerID === 0) filterStrategy = pos => pos < elem.pos;
         if (playerID === 1) filterStrategy = pos => pos > elem.pos;
      }

      if (placementStrategy === settingsConstants.placementStrategy.behindOne) {
        if (playerID === 0) filterStrategy = pos => pos === elem.pos - 1;
        if (playerID === 1) filterStrategy = pos => pos === elem.pos + 1
      }

      if (placementStrategy === settingsConstants.placementStrategy.reinforceLineOne){
          if (playerID === 0) filterStrategy = pos => pos === reinforceLine - 1 && elem.pos >= reinforceLine;
          if (playerID === 1) filterStrategy = pos => pos === reinforceLine + 1 && elem.pos <= reinforceLine;
      }

      if (placementStrategy === settingsConstants.placementStrategy.reinforceLineAny){
          if (playerID === 0) filterStrategy = pos => pos < reinforceLine && elem.pos >= reinforceLine;
          if (playerID === 1) filterStrategy = pos => pos > reinforceLine && elem.pos <= reinforceLine;
      }

      _.each(_.filter(row,filterStrategy), pos => playableSpots[pos] = 1);
  //  playableSpots.splice(playableSpots.indexOf([elem.col,elem.row]))
});

//add enemy board positions
enemyBoard.forEach((elem) => {
  playableSpots[elem.pos] = 0;
});
  return playableSpots;
}

function create() {




  background = game.add.image(0,0,'background');
  cupRed = game.add.image(0,screenY-cupHeight,'cups');
  cupBlue = game.add.image(screenX - cupWidth, screenY-cupHeight,"cups");

  //groups
  tiles = game.add.group();
  redTargets = game.add.group();
  blueTargets = game.add.group();

  redDiceInHand = game.add.group();
  blueDiceInHand = game.add.group();

  blueDiceOnBoard = game.add.group();
  redDiceOnBoard = game.add.group();

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
        temp.col = col;
        temp.row = row;
        temp.pos = rowColToPos(row,col);
      }if(col !== 0){
        var temp = blueTargets.create(spriteX,spriteY,"blueTargets");
        temp.col = col;
        temp.row = row;
        temp.pos = rowColToPos(row,col);
      }
    }
  }

  redTargets.forEach(x => x.alpha = 0.0);
  blueTargets.forEach(x => x.alpha = 0.0);

  //add dice to hands
  var i = 0;

  //make redDice
  for(i; i < playerDiceCount; i++)
  {
    let pos = [cupRed.x + i * 86,cupRed.y,cupWidth,cupHeight];
    let diceValue = rollDie();
    var dice = redDiceInHand.create(pos[0],pos[1],"redDice",diceValue - 1);

    dice.value = diceValue;
    dice.uniqueRef = "redDice"+i;
    dice.inputEnabled = true;
    dice.input.enableDrag();
    dice.events.onDragStart.add(onDragStart, this);
    dice.events.onDragStop.add(onDragStop, this);

  }

  let blueRollButton = endTurn = game.add.text(cupBlue.x + 20,cupBlue.y + 150, "ROLL",styleBlue);
  blueRollButton.inputEnabled = true;
  blueRollButton.events.onInputDown.add((evt) => {
    reroll(1);
  });

  let redRollButton = endTurn = game.add.text(cupRed.x + 20,cupRed.y + 150, "ROLL",styleRed);
  redRollButton.inputEnabled = true;
  redRollButton.events.onInputDown.add((evt) => {
    reroll(0);
  });

  //make blueDice
  i = 0;

  //make redDice
  for(i; i < playerDiceCount; i++)
  {
    let pos = [cupBlue.x + i * 86,cupBlue.y];
    let diceValue = rollDie();
    var dice = blueDiceInHand.create(pos[0],pos[1],"blueDice",diceValue - 1);

    dice.value = diceValue;
    dice.uniqueRef = "blueDice"+i;
    dice.inputEnabled = true;
    dice.input.enableDrag();
    dice.events.onDragStart.add(onDragStart, this);
    dice.events.onDragStop.add(onDragStop, this);

  }
  //End Turn Button
  endTurn = game.add.text(game.world.centerX-10,screenY - cupHeight/2, "End Turn",styleRed);
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
  if(player === 0)
    endTurn.setStyle(styleRed);
  else
    endTurn.setStyle(styleBlue);
}

function toggleDieInput(player,set){
  if(player === 0)
    redDiceInHand.forEach(die  => die.input.draggable = set);
  else {
    blueDiceInHand.forEach(die => die.input.draggable = set);
  }
}

var lastDragStartX;
var lastDragStartY;

function onDragStart(sprite, pointer) {
    lastDragStartX = sprite.x;
    lastDragStartY = sprite.y;

    var spots = getPlayableSpots(player);
    if (player === 0){
    //  var available = redTargets.filter(x => spots[x.pos] === 1);


      redTargets.filter(x => spots[x.pos] === 1).list.forEach(x => x.alpha = 0.5);

    }else {
      blueTargets.filter(x => spots[x.pos] === 1).list.forEach(x => x.alpha = 0.5);
    }

    console.log(getPlayableSpots(player));
}

function onDragStop(sprite, pointer) {
  redTargets.forEach(x => x.alpha = 0.0);
  blueTargets.forEach(x => x.alpha = 0.0);

  if(overLap(sprite.x,sprite.y,diceDim,diceDim,screenX/2 - ((boardWidth)/2 * tileDim),screenY/2 - ((boardHeight/2) * tileDim) -100,screenX/2 - ((boardWidth)/2 * tileDim) + (boardWidth * tileDim),screenY/2 - ((boardHeight/2) * tileDim) + (boardHeight * tileDim) -100)){  //draw tiles
    var col,row;
    for(col = 0; col < boardWidth; col++){
      for(row = 0; row < boardHeight; row++){
        var spriteX = screenX/2 - ((boardWidth)/2 * tileDim) + (col * tileDim);
        var spriteY = screenY/2 - ((boardHeight/2) * tileDim) + (row * tileDim) -100;
        if(overLap(sprite.x,sprite.y,diceDim,diceDim,spriteX,spriteY,tileDim,tileDim)){
          sprite.x = spriteX + (tileDim-diceDim)/2;
          sprite.y = spriteY + (tileDim-diceDim)/2;
          sprite.pos = boardWidth * row + col;
          sprite.col = col;
          sprite.row = row;
          sprite.input.draggable = false;
          sprite.parent.remove(sprite);
          if (sprite.uniqueRef.indexOf('blue') > -1){
              blueDiceOnBoard.add(sprite);
          } else {
            redDiceOnBoard.add(sprite);
          }


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
