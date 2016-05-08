import {getRandomInBounds, getRandomInsideBounds, rollDie} from './utility.js';
import _ from 'lodash';

var settingsConstants = {
	placementStrategy: {
		behindAny: "any free spot behind a friendly die",
		behindOne: "the first free spot behind a friendly die",
		reinforceLineOne: "the first free spot behind center line",
		reinforceLineAny: "any free spot behind center line",
		homeRowOnly: "only in base",
		debug: "anywhere for debug purposes"
	},
	movementStrategy: {
		afterPlayer: "after their turn",
		afterTurn: "after each turn",
		afterRound: "after each round"
	},
	rollDiceStrategy: {
		afterTurn: "after each player's turn",
		afterRound: "after each round",
		beforeTurn: "before each player's turn"
	},
	diceRollCount: [3,4,5],
	boardColumnCount: [4,6,8],
	boardRowCount: [2,3,4],

	bonusDiceGenerationStrategy: {
		topPair: "Top pair of dice generates a bonus die",
		topTwoPair: "Top two pairs of dice generate 2 bonus dice (if available)",
	},
	bonusDiceDestructionStrategy: {
		afterDeath: "Bonus dice are returned to the inactive pile only after they are killed",
		afterReroll: "Bonus dice are returned to the inactive pile if the dice are rerolled"
	}
}

global.PIXI = require('../node_modules/phaser-shim/dist/pixi');
global.Phaser = require('../node_modules/phaser-shim/dist/phaser');


var styleRed = {
	font: "20px Arial",
	fill: "#ff0044",
	align: "center"
};
var styleBlue = {
	font: "20px Arial",
	fill: "#0044FF",
	align: "center"
};
var styleWhite = {
	font: "20px Arial",
	fill: "#FFFFFF",
	align: "center"
};

var styleRedVictory = {
	font: "75px Arial",
	fill: "#ff0044",
	align: "center"
};
var styleBlueVictory = {
	font: "75px Arial",
	fill: "#0044FF",
	align: "center"
};
var styleDraw = {
	font: "75px Arial",
	fill: "#FFFFFF",
	align: "center"
};

var screenX = 1024;
var screenY = 768;


class ConfigState extends Phaser.State {
	init() {
		this.selectedConfiguration = {
			placementStrategy: "behindAny",
			movementStrategy: "afterTurn",
			rollDiceStrategy: "beforeTurn",
			diceRollCount: 4,
			bonusDiceGenerationStrategy: "topTwoPair",
			bonusDiceCount: 2,
			bonusDiceDestructionStrategy: "afterReroll",
			boardColumnCount: 6,
			boardRowCount: 3
		}
	}

	createOptionLine(x,y,textLine,replacementChar,strategies,strategyResults){
		var splitString = _.split(textLine,replacementChar);

		let LastText = null;

		splitString.forEach((string,index) => {

			var stratText = strategies[index];
			var stratResult = strategyResults[index];


					let regularText;
					if (LastText === null){
						regularText = game.add.text(x,y,string,{
							font: "30px Arial", fill: "#fff"});
					} else {
						regularText = game.make.text(x,y,string,{
							font: "30px Arial", fill: "#fff"});
						LastText.addChild(regularText);
					}

				let interactiveText = game.make.text(regularText.width,0,this.selectedConfiguration[stratResult],{
					font: "30px Arial", fill: "#ff0044"})
					regularText.addChild(interactiveText);
					interactiveText.inputEnabled = true;
					interactiveText.events.onInputDown.add(x => {

						if (_.isPlainObject(stratText)){
							let nextText = (stratText.indexOf(this.selectedConfiguration[stratResult]) + 1) % stratText.length;
							x.text = stratText[nextText];
							this.selectedConfiguration[stratResult] = stratText[nextText];
						}

						if (_.isArray(stratText)){
							let nextText = (stratText.indexOf(this.selectedConfiguration[stratResult]) + 1) % stratText.length;
							x.text = stratText[nextText];
							this.selectedConfiguration[stratResult] = stratText[nextText];
						}
					},this);

					LastText = interactiveText;

		});
	}

	create() {

	//	this.createOptionLine(0,100,"you roll % dice %",'%',settingsConstants.diceRollCount,settingsConstants.rollDiceStrategy,["diceRollCount","rollDiceStrategy"])

		var gametopText = game.add.text(game.world.centerX, 30,"Click on red text to configure",{
			font: "30px Arial", fill: "#fff"})
		gametopText.anchor.x = 0.5;
		gametopText.anchor.y = 0; //](1,0.5);
		gametopText.inputEnabled = true;
		gametopText.input.enableDrag();

		var regularText = game.add.text(20,70,"You roll ",{font: "30px Arial", fill: "#fff"});
		var interactiveText = game.add.text(regularText.width + regularText.x,regularText.y,this.selectedConfiguration.diceRollCount,{font: "30px Arial", fill: "#ff0044"})

		interactiveText.inputEnabled = true;
		interactiveText.events.onInputDown.add(x => {
			let currentIndex = settingsConstants.diceRollCount.indexOf(this.selectedConfiguration.diceRollCount);
			let nextIndex = (currentIndex + 1) % settingsConstants.diceRollCount.length;
			x.text = this.selectedConfiguration.diceRollCount = settingsConstants.diceRollCount[nextIndex];
		},this);

		regularText = game.add.text(interactiveText.x + interactiveText.width,interactiveText.y," dice ",{font: "30px Arial", fill: "#fff"});
		interactiveText = game.add.text(regularText.width + regularText.x,regularText.y,settingsConstants.rollDiceStrategy[this.selectedConfiguration.rollDiceStrategy],{font: "30px Arial", fill: "#ff0044"})
		interactiveText.inputEnabled = true;
		interactiveText.events.onInputDown.add(x => {

			var keys = _.keys(settingsConstants.rollDiceStrategy);
			let currentIndex = keys.indexOf(this.selectedConfiguration.rollDiceStrategy);
			let nextIndex = (currentIndex + 1) % keys.length;
			this.selectedConfiguration.rollDiceStrategy = keys[nextIndex];
			x.text = settingsConstants.rollDiceStrategy[this.selectedConfiguration.rollDiceStrategy];
		},this);

		var regularText = game.add.text(20,120,"Player's dice move ",{font: "30px Arial", fill: "#fff"});
		var interactiveText = game.add.text(regularText.width + regularText.x,regularText.y,settingsConstants.movementStrategy[this.selectedConfiguration.movementStrategy],{font: "30px Arial", fill: "#ff0044"})

		interactiveText.inputEnabled = true;
		interactiveText.events.onInputDown.add(x => {

			var keys = _.keys(settingsConstants.movementStrategy);
			let currentIndex = keys.indexOf(this.selectedConfiguration.movementStrategy);
			let nextIndex = (currentIndex + 1) % keys.length;
			this.selectedConfiguration.movementStrategy = keys[nextIndex];
			x.text = settingsConstants.movementStrategy[this.selectedConfiguration.movementStrategy];
		},this);

		var regularText = game.add.text(20,170,"You can place your dice on ",{font: "30px Arial", fill: "#fff"});
		var interactiveText = game.add.text(regularText.width + regularText.x,regularText.y,settingsConstants.placementStrategy[this.selectedConfiguration.placementStrategy],{font: "30px Arial", fill: "#ff0044"})

		interactiveText.inputEnabled = true;
		interactiveText.events.onInputDown.add(x => {

			var keys = _.keys(settingsConstants.placementStrategy);
			let currentIndex = keys.indexOf(this.selectedConfiguration.placementStrategy);
			let nextIndex = (currentIndex + 1) % keys.length;
			this.selectedConfiguration.placementStrategy = keys[nextIndex];
			x.text = settingsConstants.placementStrategy[this.selectedConfiguration.placementStrategy];
		},this);

		var regularText = game.add.text(20,220,"You can generate a maximum of 2 bonus dice every turn",{font: "30px Arial", fill: "#fff"});
		var regularText = game.add.text(20,270,"You can only have 2 bonus dice in play at any time",{font: "30px Arial", fill: "#fff"});

		var interactiveText = game.add.text(20,320,settingsConstants.bonusDiceDestructionStrategy[this.selectedConfiguration.bonusDiceDestructionStrategy],{font: "30px Arial", fill: "#ff0044"})

		interactiveText.inputEnabled = true;
		interactiveText.events.onInputDown.add(x => {

			var keys = _.keys(settingsConstants.bonusDiceDestructionStrategy);
			let currentIndex = keys.indexOf(this.selectedConfiguration.bonusDiceDestructionStrategy);
			let nextIndex = (currentIndex + 1) % keys.length;
			this.selectedConfiguration.bonusDiceDestructionStrategy = keys[nextIndex];
			x.text = settingsConstants.bonusDiceDestructionStrategy[this.selectedConfiguration.bonusDiceDestructionStrategy];
		},this);





		var regularText = game.add.text(20,370,"The board is ",{font: "30px Arial", fill: "#fff"});
		var interactiveText = game.add.text(regularText.width + regularText.x,regularText.y,this.selectedConfiguration.boardColumnCount,{font: "30px Arial", fill: "#ff0044"})

		interactiveText.inputEnabled = true;
		interactiveText.events.onInputDown.add(x => {
			let currentIndex = settingsConstants.boardColumnCount.indexOf(this.selectedConfiguration.boardColumnCount);
			let nextIndex = (currentIndex + 1) % settingsConstants.boardColumnCount.length;
			x.text = this.selectedConfiguration.boardColumnCount = settingsConstants.boardColumnCount[nextIndex];
		},this);

		regularText = game.add.text(interactiveText.x + interactiveText.width,interactiveText.y," columns wide and ",{font: "30px Arial", fill: "#fff"});
		var interactiveText = game.add.text(regularText.width + regularText.x,regularText.y,this.selectedConfiguration.boardRowCount,{font: "30px Arial", fill: "#ff0044"})

		interactiveText.inputEnabled = true;
		interactiveText.events.onInputDown.add(x => {
			let currentIndex = settingsConstants.boardRowCount.indexOf(this.selectedConfiguration.boardRowCount);
			let nextIndex = (currentIndex + 1) % settingsConstants.boardRowCount.length;
			x.text = this.selectedConfiguration.boardRowCount = settingsConstants.boardRowCount[nextIndex];
		},this);

		regularText = game.add.text(interactiveText.x + interactiveText.width,interactiveText.y," rows tall",{font: "30px Arial", fill: "#fff"});

		regularText = game.add.text(420,game.world.centerX," START ",{font: "60px Arial", fill: "#fff"});
		regularText.inputEnabled = true;
		regularText.events.onInputDown.add(x => {
			game.state.start("Game",true,false,this.selectedConfiguration);
		});


}

}

class GameState extends Phaser.State {

	init(config) {
		//super()
		this.background;
		this.cupRed;
		this.cupBlue;
		this.cupHeight = 200;
		this.cupWidth = 450;
		this.board;
		this.boardHeight = config.boardRowCount;
		this.boardWidth = config.boardColumnCount;
		this.tileDim = 127;
		this.diceDim = 85;
		this.gameOver = false;
		this.screenX = 1024;
		this.screenY = 768;
		this.endTurn;

		this.placementStrategy = settingsConstants.placementStrategy[config.placementStrategy];
		this.movementStrategy = settingsConstants.movementStrategy[config.movementStrategy];
		this.rollDiceStrategy = settingsConstants.rollDiceStrategy[config.rollDiceStrategy];

		this.bonusDiceGenerationStrategy = settingsConstants.bonusDiceGenerationStrategy[config.bonusDiceGenerationStrategy];
		this.bonusDiceDestructionStrategy = settingsConstants.bonusDiceDestructionStrategy[config.bonusDiceDestructionStrategy];

		this.playerDiceCount = config.diceRollCount;
		this.playerBonusDiceCount = config.bonusDiceCount;

		//groups
		this.tiles;
		this.redTargets;
		this.blueTargets;
		this.redDiceInHand;
		this.blueDiceInHand;

		this.redInactiveBonusDice;
		this.blueInactiveBonusDice;

		this.blueDiceOnBoard;
		this.redDiceOnBoard;

		//simpleGameState
		this.player = 0;


		this.lastDragStartX;
		this.lastDragStartY;


	}

	preload() {
		//Background
		game.load.image('background', 'dist/images/wood.jpg');
		game.load.image('cups', 'dist/images/cups.png');
		//TilePieces
		game.load.image('tileRed', 'dist/images/tileRed.png');
		game.load.image('tileBlue', 'dist/images/tileBlue.png');
		game.load.image('tileRedB', 'dist/images/tileRedB.png');
		game.load.image('tileBlueB', 'dist/images/tileBlueB.png');
		game.load.image('tileRedStart', 'dist/images/tileRedStart.png');
		game.load.image('tileBlueStart', 'dist/images/tileBlueStart.png');
		game.load.image('tileNeutral', 'dist/images/tileNeutral.png');
		//dice
		game.load.spritesheet('redDice', "dist/images/DieRed.png", 85, 85, 6);
		game.load.spritesheet('blueDice', "dist/images/DieBlue.png", 85, 85, 6);
		game.load.spritesheet('redBonusDice', "dist/images/DieGlassRed.png", 85, 85, 6);
		game.load.spritesheet('blueBonusDice', "dist/images/DieGlassBlue.png", 85, 85, 6);
		//targets
		game.load.image('redTargets', 'dist/images/tileRedMove.png');
		game.load.image('blueTargets', 'dist/images/tileBlueMove.png');
		game.load.image('redTargetsB', 'dist/images/tileRedMoveB.png');
		game.load.image('blueTargetsB', 'dist/images/tileBlueMoveB.png');
	}
	setText(text) {
		text.setText("- You have clicked -\n" + store.getState().appstate + " times !");
	}






 reroll(player) {


	var playerHand = player === 0 ? this.redDiceInHand : this.blueDiceInHand;
	var inactiveBonusDice = player === 0 ? this.redInactiveBonusDice : this.blueInactiveBonusDice;

	if (this.bonusDiceDestructionStrategy === settingsConstants.bonusDiceDestructionStrategy.afterReroll) {
		var toRemove = _.filter(playerHand.children, x => x.isBonus);
		_.each(toRemove, x => {
			playerHand.remove(x)
			x.alpha = 0;
			x.input.draggable = false;
			inactiveBonusDice.add(x);
			x.x = game.world.centerX - Math.floor(this.diceDim / 2);
			x.y = this.screenY;
		});


	}

	playerHand.forEach((die) => {

		if (die.isBonus != true) {
			let diceValue = rollDie();

			var texture = die.key;
			die.value = diceValue;
			this.jumpDieToCup(die, player);
			die.rollAnimation.play(10, true)
			game.time.events.add(Phaser.Timer.SECOND / 2 + 10 * rollDie(), this.stopDie, this, die);
		}


	});


	if (inactiveBonusDice.children.length > 0) {
		var grouped = _.groupBy(playerHand.children, x => x.value)
		var filtered = _.filter(grouped, x => x.length > 1)

		if (filtered.length > 0) {
			if (this.bonusDiceGenerationStrategy === settingsConstants.bonusDiceGenerationStrategy.topPair) {
				var topPairValue = _.maxBy(filtered, x => x[0].value)[0].value;
				var diceToSet = inactiveBonusDice.children[inactiveBonusDice.children.length - 1];
				inactiveBonusDice.remove(diceToSet);
				playerHand.add(diceToSet);
				diceToSet.alpha = 1;
				diceToSet.value = topPairValue;
				diceToSet.frame = topPairValue - 1;
				diceToSet.input.draggable = true;
				this.jumpDieToCup(diceToSet, player);
			}


		}
	}


}

 stopDie(die) {
	die.rollAnimation.stop();
	die.frame = die.value - 1;
}

 posToRowHeight(pos) {
	//sprite.pos = boardWidth * row + col;
	return {
		col: pos % this.boardWidth,
		row: Math.floor(pos / this.boardWidth)
	}
}
//18 0,4

 rowColToPos(row, col) {
	return this.boardWidth * row + col;
}

 getAllPositionsInRow(pos) {
	let {
		row, col
	} = this.posToRowHeight(pos);
	return _.range(pos - col, pos - col + this.boardWidth);
}

 isPlayableSpot(playerID, row, col) {
	var playableSpots = this.getPlayableSpots(playerID);

	return playableSpots[this.rowColToPos(row, col)] === 1;

}

 getPlayableSpots(playerID) {

	//your board and enemy board
	var board = playerID === 0 ? this.redDiceOnBoard : this.blueDiceOnBoard;
	var enemyBoard = playerID === 1 ? this.redDiceOnBoard : this.blueDiceOnBoard;

	//base row
	var homeRow = playerID === 0 ? 0 : this.boardWidth - 1;
	let playableSpots = [];
	for (let i = 0; i < this.boardHeight * this.boardWidth; i++) {
		playableSpots.push(1);
	}

	//remove everything except the home row, this is the default strategy
	for (let i = 0; i < playableSpots.length; i++) {
		if (this.posToRowHeight(i).col !== homeRow) {
			playableSpots[i] = 0;
		}
	}

	//add full board positions
	board.forEach((elem) => {
		playableSpots[elem.pos] = 0; //remove the position of the dice itself
		var row = this.getAllPositionsInRow(elem.pos);
		var reinforceLine = row[Math.ceil(this.boardWidth / 2)];

		if (playerID === 1) reinforceLine -= 1;

		var filterStrategy;

		if (this.placementStrategy === settingsConstants.placementStrategy.behindAny) {
			if (playerID === 0) filterStrategy = pos => pos < elem.pos;
			if (playerID === 1) filterStrategy = pos => pos > elem.pos;
		}

		if (this.placementStrategy === settingsConstants.placementStrategy.behindOne) {
			if (playerID === 0) filterStrategy = pos => pos === elem.pos - 1;
			if (playerID === 1) filterStrategy = pos => pos === elem.pos + 1
		}

		if (this.placementStrategy === settingsConstants.placementStrategy.reinforceLineOne) {
			if (playerID === 0) filterStrategy = pos => pos === reinforceLine - 1 && elem.pos >= reinforceLine;
			if (playerID === 1) filterStrategy = pos => pos === reinforceLine + 1 && elem.pos <= reinforceLine;
		}

		if (this.placementStrategy === settingsConstants.placementStrategy.reinforceLineAny) {
			if (playerID === 0) filterStrategy = pos => pos < reinforceLine && elem.pos >= reinforceLine;
			if (playerID === 1) filterStrategy = pos => pos > reinforceLine && elem.pos <= reinforceLine;
		}

		_.each(_.filter(row, filterStrategy), pos => playableSpots[pos] = 1);
		//  playableSpots.splice(playableSpots.indexOf([elem.col,elem.row]))
	});



	//add enemy board positions
	enemyBoard.forEach((elem) => {
		playableSpots[elem.pos] = 0;
	});

	if (this.placementStrategy === settingsConstants.placementStrategy.debug) {
		var i = 0;
		for (i = 0; i < playableSpots.length; i++) playableSpots[i] = 1;
	}
	return playableSpots;
}

 create() {
	this.background = game.add.image(0, 0, 'background');
	this.cupRed = game.add.image(0, screenY - this.cupHeight, 'cups');
	this.cupBlue = game.add.image(screenX - this.cupWidth, screenY - this.cupHeight, "cups");

	//groups
	this.tiles = game.add.group();
	this.redTargets = game.add.group();
	this.blueTargets = game.add.group();

	this.redDiceInHand = game.add.group();
	this.blueDiceInHand = game.add.group();

	this.blueDiceOnBoard = game.add.group();
	this.redDiceOnBoard = game.add.group();

	this.redInactiveBonusDice = game.add.group();
	this.blueInactiveBonusDice = game.add.group();

	//draw tiles
	var col, row;
	for (col = 0; col < this.boardWidth; col++) {
		for (row = 0; row < this.boardHeight; row++) {
			var spriteimage = "tileNeutral";
			var spriteX = this.screenX / 2 - ((this.boardWidth) / 2 * this.tileDim) + (col * this.tileDim);
			var spriteY = this.screenY / 2 - ((this.boardHeight / 2) * this.tileDim) + (row * this.tileDim) - 100;

			if (col === 0)
				spriteimage = "tileRedStart";
			else if (col === this.boardWidth - 1)
				spriteimage = "tileBlueStart";
			else if (col < this.boardWidth / 2) {
				spriteimage = (false) ? "tileRed" : "tileRedB";
			} else if (col >= this.boardWidth / 2) {
				spriteimage = (false) ? "tileBlue" : "tileBlueB";
			}
			console.log(col % 2 + ', ' + row % 2);
			this.tiles.create(spriteX, spriteY, spriteimage);
			if (col !== this.boardWidth - 1) {
				let targetTex = (col === 0) ? "redTargets" : "redTargetsB";
				var temp = this.redTargets.create(spriteX, spriteY, targetTex);
				temp.uniqueRef = "T" + col + row;
				temp.col = col;
				temp.row = row;
				temp.pos = this.rowColToPos(row, col);
			}
			if (col !== 0) {
				let targetTex = (col === this.boardWidth - 1) ? "blueTargets" : "blueTargetsB";
				var temp = this.blueTargets.create(spriteX, spriteY, targetTex);
				temp.col = col;
				temp.row = row;
				temp.pos = this.rowColToPos(row, col);
			}
		}
	}

	this.redTargets.forEach(x => x.alpha = 0.0);
	this.blueTargets.forEach(x => x.alpha = 0.0);

	//add dice to hands
	var i = 0;

	//make redDice
	for (i = 0; i < this.playerDiceCount; i++) {
		let pos = getRandomInsideBounds(this.cupRed.x, this.cupRed.y, this.cupWidth, this.cupHeight, this.diceDim);
		var dice = this.redDiceInHand.create(pos[0], pos[1], "redDice", diceValue - 1);
		let diceValue = 1;
		dice.value = diceValue;
		dice.uniqueRef = "redDice" + i;
		dice.inputEnabled = true;
		dice.input.enableDrag();
		dice.isBonus = false;
		dice.events.onDragStart.add(this.onDragStart, this);
		dice.events.onDragStop.add(this.onDragStop, this);
		dice.currentTween = null;
		dice.unstopableTween = null;

		dice.rollAnimation = dice.animations.add("roll");
	}

	for (i = 0; i < this.playerBonusDiceCount; i++) {
		let pos = [this.cupRed.x + i * 86, this.cupRed.y + 100, this.cupWidth, this.cupHeight];
		let diceValue = 1;
		var dice = this.redInactiveBonusDice.create(pos[0], pos[1], "redBonusDice", diceValue - 1);

		dice.value = diceValue;
		dice.uniqueRef = "redBonusDice" + i;
		dice.isBonus = true;
		dice.currentTween = null;
		dice.unstopableTween = null;
		dice.alpha = 0;
		dice.inputEnabled = true;
		dice.input.enableDrag();
		dice.events.onDragStart.add(this.onDragStart, this);
		dice.events.onDragStop.add(this.onDragStop, this);
		dice.currentTween = null;
		dice.input.draggable = false;
		dice.x = game.world.centerX - Math.floor(this.diceDim / 2);
		dice.y = screenY;
	}

	//make blueDice
	i = 0;
	for (i; i < this.playerDiceCount; i++) {
		let pos = getRandomInsideBounds(this.cupBlue.x, this.cupBlue.y, this.cupWidth, this.cupHeight, this.diceDim);
		let diceValue = 1;
		var dice = this.blueDiceInHand.create(pos[0], pos[1], "blueDice", diceValue - 1);

		dice.value = diceValue;
		dice.uniqueRef = "blueDice" + i;
		dice.inputEnabled = true;
		dice.input.enableDrag();
		dice.isBonus = false;
		dice.events.onDragStart.add(this.onDragStart, this);
		dice.events.onDragStop.add(this.onDragStop, this);
		dice.currentTween = null;
		dice.unstopableTween = null;
		dice.input.draggable = false;

		dice.rollAnimation = dice.animations.add("roll");
	}

	for (i = 0; i < this.playerBonusDiceCount; i++) {
		let pos = [this.cupBlue.x + i * 86, this.cupBlue.y + 100, this.cupWidth, this.cupHeight];
		let diceValue = 1
		var dice = this.blueInactiveBonusDice.create(pos[0], pos[1], "blueBonusDice", diceValue - 1);

		dice.value = diceValue;
		dice.uniqueRef = "blueBonusDice" + i;
		dice.isBonus = true;
		dice.currentTween = null;
		dice.unstopableTween = null;
		dice.alpha = 0;
		dice.inputEnabled = true;
		dice.input.enableDrag();
		dice.events.onDragStart.add(this.onDragStart, this);
		dice.events.onDragStop.add(this.onDragStop, this);
		dice.currentTween = null;
		dice.input.draggable = false;
		dice.x = game.world.centerX - Math.floor(this.diceDim / 2);
		dice.y = this.screenY;
	}

	this.reroll(0);
	this.reroll(1);
	this.clearTweens();
	//End Turn Button
	this.endTurn = game.add.text(game.world.centerX - 10, this.screenY - this.cupHeight / 2, "End Turn", styleRed);
	this.endTurn.inputEnabled = true;

	this.endTurn.events.onInputDown.add(() => {
		this.endPlayerTurn()
	});
}

 endPlayerTurn() {
	this.clearTweens();
	this.toggleDieInput(this.player, false);
	this.endTurn.setStyle(styleWhite);
	this.endTurn.inputEnabled = false;

	if (this.rollDiceStrategy === settingsConstants.rollDiceStrategy.afterTurn) {
		this.reroll(this.player);
		game.time.events.add(Phaser.Timer.SECOND * 0.6, this.runBoard, this);
	}else if (this.rollDiceStrategy === settingsConstants.rollDiceStrategy.afterRound && this.player === 1) {
		this.reroll(1);
		this.reroll(0);
		game.time.events.add(Phaser.Timer.SECOND * 0.6, this.runBoard, this);
	}else{
		this.runBoard();
	}
}

 runBoard(){
	this.clearTweens();
	if (this.movementStrategy === settingsConstants.movementStrategy.afterPlayer) {
		if (this.player === 0) this.redDiceOnBoard.forEach(function(die) {
			this.moveForward(die, 0)
		}.bind(this));
		if (this.player === 1) this.blueDiceOnBoard.forEach(function(die) {
			this.moveForward(die, 1)
		}.bind(this));
	}
	if (this.movementStrategy === settingsConstants.movementStrategy.afterTurn) {
		this.redDiceOnBoard.forEach(function(die) {
			this.moveForward(die, 0)
		}.bind(this));
		this.blueDiceOnBoard.forEach(function(die) {
			this.moveForward(die, 1)
		}.bind(this));
	}
	if (this.movementStrategy === settingsConstants.movementStrategy.afterRound && this.player === 1) {
		this.redDiceOnBoard.forEach(function(die) {
			this.moveForward(die, 0)
		}.bind(this));
		this.blueDiceOnBoard.forEach(function(die) {
			this.moveForward(die, 1)
		}.bind(this));
	}
	game.time.events.add(Phaser.Timer.SECOND, this.switchPlayer, this);
}

 switchPlayer() {
	this.player++;
	this.player = this.player % 2;
	if (this.rollDiceStrategy === settingsConstants.rollDiceStrategy.beforeTurn) {
		this.reroll(this.player);
		game.time.events.add(Phaser.Timer.SECOND * 0.6, this.startTurn, this);
	}else{
		this.startTurn();
	}
}

 startTurn(){
	this.clearTweens();
	this.toggleDieInput(this.player, true);
	if (this.player === 0)
		this.endTurn.setStyle(styleRed);
	else
		this.endTurn.setStyle(styleBlue);
	this.endTurn.inputEnabled = true;
}

 toggleDieInput(player, set) {
	if (player === 0)
		this.redDiceInHand.forEach(die => die.input.draggable = set);
	else {
		this.blueDiceInHand.forEach(die => die.input.draggable = set);
	}
}

 clearTweens() {
	this.redDiceInHand.forEach(function(red) {
		red.unstopableTween = null;
	})
	this.blueDiceInHand.forEach(function(blue) {
		blue.unstopableTween = null;
	})
}

 onDragStart(sprite, pointer) {
	this.lastDragStartX = sprite.x;
	this.lastDragStartY = sprite.y;

	var spots = this.getPlayableSpots(this.player);
	if (this.player === 0) {
		//  var available = redTargets.filter(x => spots[x.pos] === 1);


		this.redTargets.filter(x => spots[x.pos] === 1).list.forEach(x => x.alpha = 0.5);

	} else {
		this.blueTargets.filter(x => spots[x.pos] === 1).list.forEach(x => x.alpha = 0.5);
	}
}

 onDragStop(sprite, pointer) {
	this.redTargets.forEach(x => x.alpha = 0.0);
	this.blueTargets.forEach(x => x.alpha = 0.0);

	if (this.overLap(sprite.x, sprite.y, this.diceDim, this.diceDim, this.screenX / 2 - ((this.boardWidth) / 2 * this.tileDim),
	this.screenY / 2 - ((this.boardHeight / 2) * this.tileDim) - 100,
	this.screenX / 2 - ((this.boardWidth) / 2 * this.tileDim) + (this.boardWidth * this.tileDim),
	this.screenY / 2 - ((this.boardHeight / 2) * this.tileDim) + (this.boardHeight * this.tileDim) - 100))
	{ //draw tiles
		var col, row;
		for (col = 0; col < this.boardWidth; col++) {
			for (row = 0; row < this.boardHeight; row++) {
				var spriteX = this.screenX / 2 - ((this.boardWidth) / 2 * this.tileDim) + (col * this.tileDim);
				var spriteY = this.screenY / 2 - ((this.boardHeight / 2) * this.tileDim) + (row * this.tileDim) - 100;
				if (this.overLap(sprite.x, sprite.y, this.diceDim, this.diceDim, spriteX, spriteY, this.tileDim, this.tileDim) && this.isPlayableSpot(this.player, row, col)) {
					sprite.x = spriteX + (this.tileDim - this.diceDim) / 2;
					sprite.y = spriteY + (this.tileDim - this.diceDim) / 2;
					sprite.pos = this.boardWidth * row + col;
					sprite.col = col;
					sprite.row = row;
					sprite.input.draggable = false;
					sprite.parent.remove(sprite);
					if (sprite.uniqueRef.indexOf('blue') > -1) {
						this.blueDiceOnBoard.add(sprite);
					} else {
						this.redDiceOnBoard.add(sprite);
					}
					return;
				}
			}
		}

	}
	if (this.player == 0) {
		if (!this.overLap(sprite.x, sprite.y, this.diceDim, this.diceDim, this.cupRed.x, this.cupRed.y, this.cupWidth, this.cupHeight)) {
			sprite.x = this.lastDragStartX;
			sprite.y = this.lastDragStartY;
		}
	} else {
		if (!this.overLap(sprite.x, sprite.y, this.diceDim, this.diceDim, this.cupBlue.x, this.cupBlue.y, this.cupWidth, this.cupHeight)) {
			sprite.x = this.lastDragStartX;
			sprite.y = this.lastDragStartY;
		}
	}
}

 jumpDieToCup(dieSprite, whosCup) {
	var pos;
	if (whosCup === 0) {
		//pos = [cupRed.x + 4 * 86,cupRed.y,cupWidth,cupHeight];
		pos = getRandomInsideBounds(this.cupRed.x, this.cupRed.y, this.cupWidth, this.cupHeight, this.diceDim);
	} else {
		pos = getRandomInsideBounds(this.cupBlue.x, this.cupBlue.y, this.cupWidth, this.cupHeight, this.diceDim);
		//pos = [cupBlue.x + 4 * 86,cupBlue.y];
	}
	// Add a simple bounce tween to each character's position.
	dieSprite.unstopableTween = game.add.tween(dieSprite).to({
		x: pos[0],
		y: pos[1]
	}, 500, Phaser.Easing.Cubic.In, true);

	// Add another rotation tween to the same character.
	game.add.tween(dieSprite.scale).to({
		x: 1.3,
		y: 1.3
	}, 250, Phaser.Easing.Quadratic.InOut, true, 0, 0, true);
}

 moveForward(dieSprite, whoOwns) {
	var direction = 1
	if (whoOwns != 0) direction = -1;

	dieSprite.direction = direction;
	dieSprite.pos = this.rowColToPos(dieSprite.row, dieSprite.col);
	var dest = dieSprite.x + direction * (this.tileDim);
	//game.physics.arcade.accelerateToXY(dieSprite,dest,dieSprite.y);
	dieSprite.currentTween = game.add.tween(dieSprite).to({
		x: dest
	}, 500, Phaser.Easing.Cubic.In, true);
	dieSprite.currentTween.onComplete.add(this.didCompleteMoveTween.bind(this), dieSprite);
	game.add.tween(dieSprite).to({
		angle: -5 * direction
	}, 250, Phaser.Easing.Quadratic.InOut, true, 0, 0, true);
}

 didCompleteMoveTween(sprite) {
	sprite.col += sprite.direction;
	sprite.pos = this.rowColToPos(sprite.row, sprite.col);
}

 inBounds(x, y, w, h, bx, by, bw, bh) {
	return !(
		x + w < bx ||
		y + h < by ||
		x > bx + bw ||
		y > by + bh
	);
}

 overLap(x, y, w, h, bx, by, bw, bh) {
	return (
		x + w < bx + bw &&
		y + h < by + bh &&
		x > bx &&
		y > by
	);
}

 render() {

}

 update() {
	if (!this.gameOver) {
		this.redDiceOnBoard.forEach(function(red) {
			this.blueDiceOnBoard.forEach(function(blue) {
				if (this.checkOverlap(red, blue) && red.unstopableTween === null && blue.unstopableTween === null) {
					this.collisionHandler(red, blue)
				};
			}.bind(this))
		}.bind(this))
		var victory = this.checkVictory()
		if (victory != -1) {
			this.drawVictory(victory);
			this.gameOver = true;
		}
	} else {
		this.toggleDieInput(0, false);
		this.toggleDieInput(1, false);
		this.endTurn.inputEnabled = false;
	}
}

 checkVictory() {
	var redVict = false;
	var blueVict = false;

	this.redDiceOnBoard.forEach(function(red) {
		if (red.col === this.boardWidth - 1) redVict = true;
	}.bind(this));
	this.blueDiceOnBoard.forEach(function(blue) {
		if (blue.col === 0) blueVict = true;
	}.bind(this));

	if (redVict && blueVict) {
		return 2;
	} else if (redVict) {
		return 0;
	} else if (blueVict) {
		return 1;
	} else {
		return -1;
	}
}

 drawVictory(victory) {
	this.toggleDieInput(0, false);
	this.toggleDieInput(1, false);
	this.endTurn.inputEnabled = false;
	var style = styleDraw;
	var name = "Nobody";
	if (victory === 0) {
		style = styleRedVictory;
		name = "Red";
	} else if (victory === 1) {
		style = styleBlueVictory;
		name = "Blue"
	}
	var victoryTest = name + " Wins!";

	var textv = game.add.text(game.world.centerX, game.world.centerY, victoryTest, style);
	textv.anchor.set(0.5);
	textv.stroke = "#FFFFFF";
	textv.strokeThickness = 3;
	textv.angle = -5;
	game.add.tween(textv).to({
		angle: 10
	}, 2000, Phaser.Easing.Quadratic.Out, true, 0, -1, true);
	game.add.tween(textv.scale).to({
		x: 1.3,
		y: 1.3
	}, 1000, Phaser.Easing.Quadratic.Out, true, 0, -1, true);
}

 checkOverlap(spriteA, spriteB) {

	var boundsA = spriteA.getBounds();
	var boundsB = spriteB.getBounds();

	return Phaser.Rectangle.intersects(boundsA, boundsB);

}

 collisionHandler(red, blue) {
	var result = this.resolveConflict(red, blue);
	if (result[0] === 0) {
		this.stopAndReturnToCup(blue, 1);
		red.value = result[1];
		red.frame = red.value - 1;
	} else if (result[0] === 1) {
		this.stopAndReturnToCup(red, 0);
		blue.value = result[1];
		blue.frame = blue.value - 1;
	} else {
		this.stopAndReturnToCup(red, 0);
		this.stopAndReturnToCup(blue, 1);
	}
}

 stopAndReturnToCup(sprite, whosCup) {
	if (sprite.currentTween != null)
		sprite.currentTween.stop();
	sprite.currentTween = null;
	sprite.parent.remove(sprite);
	if (sprite.uniqueRef.indexOf('blue') > -1) {
		if (sprite.isBonus) {
			sprite.alpha = 0;
			this.blueInactiveBonusDice.add(sprite);
		} else {
			this.blueDiceInHand.add(sprite);
		}

	} else {
		if (sprite.isBonus) {
			sprite.alpha = 0;
			this.redInactiveBonusDice.add(sprite);
		} else {
			this.redDiceInHand.add(sprite);
		}
	}
	this.jumpDieToCup(sprite, whosCup);
}

 resolveConflict(red, blue) {
	var victory = -1;
	var val = -1;

	if (red.value > blue.value) {
		victory = 0;
		val = red.value - blue.value;
	} else if (blue.value > red.value) {
		victory = 1;
		val = blue.value - red.value;
	}

	return [victory, val];
}
}

var game = new Phaser.Game(screenX, screenY, Phaser.Canvas, 'cube-party');

game.state.add("Game",GameState,false);
game.state.add("Config",ConfigState,false);
game.state.start("Config");
