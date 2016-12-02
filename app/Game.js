import Phaser from '<shims>/Phaser';
import GameState from './states/GameState';

const Game = {
	initialize: function (width, height, engine = Phaser.AUTO, callbacks = {
			preload: this.preload, 
			create:this.create, 
	}) {
		var game = {};

		game.phaserGame = new Phaser.Game(width, height, engine, 'content', callbacks);
		return game;
	},
	preload: function () {
		this.load.tilemap('demo-tilemap', './../assets/maps/map2.json', null, Phaser.Tilemap.TILED_JSON);
		this.load.image('ground_32x32', './../assets/images/ninja-tiles32-purple.png');
		this.load.image('mountains-bg', './../assets/images/mountains-back.png');
		this.load.image('mountains-mid1', './../assets/images/mountains-mid1.png');
		this.load.image('mountains-mid2', './../assets/images/mountains-mid2.png');
	},
	create: function () {
		this.time.advancedTiming = true;
		this.game.physics.startSystem(Phaser.Physics.ARCADE);		
		this.game.plugins.add(Phaser.Plugin.ArcadeSlopes);

		this.game.state.add('GameState', GameState.initialize(), false);
		this.game.state.start('GameState');
	}
};

export default Game;