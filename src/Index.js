import {getRandomInBounds, rollDie} from './utility.js'
import _ from 'lodash';

var settingsConstants = {
  placementStrategy: {
    behindAny: "Any free spot behind a friendly die",
    behindOne: "First free spot behind a friendly die",
    reinforceLineOne: "First free spot behind center line",
    reinforceLineAny: "Any free spot behind center line",
    homeRowOnly: "Only in base"
  },
  movementStrategy: {
    afterPlayer: "Moves current player's dice after their turn",
    afterTurn: "Moves both player's dice after each turn",
    afterRound: "Moves dice after each round"
  },
  rollDiceStrategy: {
    afterTurn: "Roll dice after each player's turn",
    afterRound: "Roll both player's dice after each round",
    beforeTurn: "Roll dice before each player's turn"
  }
}


global.PIXI = require('../node_modules/phaser-shim/dist/pixi');
global.Phaser = require('../node_modules/phaser-shim/dist/phaser');


var styleRed = { font: "20px Arial", fill: "#ff0044", align: "center" };
var styleBlue = { font: "20px Arial", fill: "#0044FF", align: "center" };
var styleWhite = { font: "20px Arial", fill: "#FFFFFF", align: "center" };

var styleRedVictory = { font: "75px Arial", fill: "#ff0044", align: "center" };
var styleBlueVictory = { font: "75px Arial", fill: "#0044FF", align: "center" };
var styleDraw = { font: "75px Arial", fill: "#FFFFFF", align: "center" };

var screenX = 1024;
var screenY = 768;
var game = new Phaser.Game(screenX, screenY, Phaser.Canvas, 'cube-party', { preload: preload, create: create, update: update, render: render });
var gameOver = false;


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
var movementStrategy = settingsConstants.movementStrategy.afterRound;
var rollDiceStrategy = settingsConstants.rollDiceStrategy.afterRound;
var playerDiceCount = 6;
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
  //  jumpDieToCup(die,player);
    die.value = diceValue;
    die.frame = diceValue - 1;
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

  return playableSpots[rowColToPos(row, col)] === 1;

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
    dice.currentTween = null;
    dice.unstopableTween = null;
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
    dice.currentTween = null;
    dice.unstopableTween = null;
    dice.input.draggable = false;
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

  endTurn.setStyle(styleWhite);

  if (rollDiceStrategy === settingsConstants.rollDiceStrategy.beforeTurn){
    if (player === 0) reroll(1);
    if (player === 1) reroll(0);
  }

  if (rollDiceStrategy === settingsConstants.rollDiceStrategy.afterTurn) {
    if (player === 1) reroll(1);
    if (player === 0) reroll(0);
  }

  if (rollDiceStrategy === settingsConstants.rollDiceStrategy.afterRound && player === 1){
    reroll(1);
    reroll(0);
  }
  if (movementStrategy === settingsConstants.movementStrategy.afterPlayer){
    if (player === 0) redDiceOnBoard.forEach(function(die) { moveForward(die,0)});
    if (player === 1) blueDiceOnBoard.forEach(function(die) { moveForward(die,1)});
  }
  if (movementStrategy === settingsConstants.movementStrategy.afterTurn) {
    redDiceOnBoard.forEach(function(die) { moveForward(die,0)});
    blueDiceOnBoard.forEach(function(die) { moveForward(die,1)});
  }
  if (movementStrategy === settingsConstants.movementStrategy.afterRound && player === 1){
    redDiceOnBoard.forEach(function(die) { moveForward(die,0)});
    blueDiceOnBoard.forEach(function(die) { moveForward(die,1)});
  }
  game.time.events.add(Phaser.Timer.SECOND * 0.6, switchPlayer, this);
}

function switchPlayer(){
  player++;
  player = player % 2;
  clearTweens();
  toggleDieInput(player,true);
  if(player === 0)
    endTurn.setStyle(styleRed);
  else
    endTurn.setStyle(styleBlue);
  endTurn.inputEnabled = true;
}

function toggleDieInput(player,set){
  if(player === 0)
    redDiceInHand.forEach(die  => die.input.draggable = set);
  else {
    blueDiceInHand.forEach(die => die.input.draggable = set);
  }
}

function clearTweens(){
  redDiceInHand.forEach(function(red){red.unstopableTween = null;})
  blueDiceInHand.forEach(function(blue){blue.unstopableTween = null;})
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
        if(overLap(sprite.x,sprite.y,diceDim,diceDim,spriteX,spriteY,tileDim,tileDim) && isPlayableSpot(player,row,col)){
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

function jumpDieToCup(dieSprite,whosCup){
  var pos;
  if (whosCup === 0){
    pos = [cupRed.x + 4 * 86,cupRed.y,cupWidth,cupHeight];
    //pos = getRandomInBounds(cupRed.x,cupRed.y,cupWidth,cupHeight);
  }else{
    //pos = getRandomInBounds(cupBlue.x,cupBlue.y,cupWidth,cupHeight);
    pos = [cupBlue.x + 4 * 86,cupBlue.y];
  }
  // Add a simple bounce tween to each character's position.
  dieSprite.unstopableTween = game.add.tween(dieSprite).to({x:pos[0],y:pos[1]}, 500, Phaser.Easing.Cubic.In, true);

  // Add another rotation tween to the same character.
  game.add.tween(dieSprite.scale).to({x:1.3,y:1.3}, 250, Phaser.Easing.Quadratic.InOut, true, 0, 0, true);
}

function moveForward(dieSprite, whoOwns){
  var direction = 1
  if(whoOwns != 0) direction = -1;

  dieSprite.col += direction;
  dieSprite.pos = rowColToPos(dieSprite.row,dieSprite.col);
  var dest = dieSprite.x +  direction * (tileDim);
  //game.physics.arcade.accelerateToXY(dieSprite,dest,dieSprite.y);
  dieSprite.currentTween = game.add.tween(dieSprite).to({x:dest}, 250, Phaser.Easing.Cubic.In, true);
  game.add.tween(dieSprite).to({angle:-5*direction}, 125, Phaser.Easing.Quadratic.InOut, true, 0, 0, true);
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

function update(){
  if(!gameOver){
  redDiceOnBoard.forEach(function(red){
    blueDiceOnBoard.forEach(function(blue){
      if(checkOverlap(red,blue) && red.unstopableTween === null && blue.unstopableTween === null){ collisionHandler(red,blue) };
    })
  })
  var victory = checkVictory()
  if(victory != -1) {
    drawVictory(victory);
    gameOver = true;
  }
}else{
  endTurn.inputEnabled = false;
}
}

function checkVictory(){
  var redVict = false;
  var blueVict = false;

  redDiceOnBoard.forEach(function(red) { if (red.col === boardWidth-1) redVict = true;});
  blueDiceOnBoard.forEach(function(blue) { if (blue.col === 0) blueVict = true;});

  if(redVict && blueVict){
    return 2;
  }else if(redVict){
    return 0;
  }else if(blueVict){
    return 1;
  }else{
    return -1;
  }
}

function drawVictory(victory){
  toggleDieInput(0,false);
  toggleDieInput(1,false);
  endTurn.inputEnabled = false;
  var style = styleDraw;
  var name = "Nobody";
  if(victory === 0){
    style = styleRedVictory;
    name = "Red";
  }else if (victory === 1){
    style = styleBlueVictory;
    name = "Blue"
  }
  var victoryTest = name + " Wins!";

  var textv=game.add.text(game.world.centerX,game.world.centerY, victoryTest,style);
  textv.anchor.set(0.5);
  textv.stroke = "#FFFFFF";
  textv.strokeThickness = 3;
  textv.angle = -5;
  game.add.tween(textv).to({angle:10}, 2000, Phaser.Easing.Quadratic.Out, true, 0, -1, true);
  game.add.tween(textv.scale).to({x:1.3,y:1.3}, 1000, Phaser.Easing.Quadratic.Out, true, 0, -1, true);
}

function checkOverlap(spriteA, spriteB) {

    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();

    return Phaser.Rectangle.intersects(boundsA, boundsB);

}

function collisionHandler(red, blue){
  var result = resolveConflict(red,blue);
  if(result[0] === 0){
    stopAndReturnToCup(blue,1);
    red.value = result[1];
    red.frame = red.value -1;
  }else if(result[0] === 1){
    stopAndReturnToCup(red,0);
    blue.value = result[1];
    blue.frame = blue.value -1;
  }else{
    stopAndReturnToCup(red,0);
    stopAndReturnToCup(blue,1);
  }
}

function stopAndReturnToCup(sprite, whosCup){
  if (sprite.currentTween != null)
    sprite.currentTween.stop();
  sprite.currentTween = null;
  sprite.parent.remove(sprite);
  if (sprite.uniqueRef.indexOf('blue') > -1){
      blueDiceInHand.add(sprite);
  } else {
    redDiceInHand.add(sprite);
  }
  jumpDieToCup(sprite,whosCup);
}

function resolveConflict(red, blue){
  var victory = -1;
  var val = -1;

  if (red.value > blue.value){
    victory = 0;
    val = red.value - blue.value;
  }else if(blue.value > red.value){
    victory = 1;
    val = blue.value - red.value;
  }

  return [victory,val];
}
