import Phaser from '<shims>/Phaser';
import GameState from './states/GameState';

const Game = {
	initialize: function (width, height, engine = Phaser.AUTO, callbacks = {preload: this.preload, create:this.create}) {
		var game = {};
		game.phaserGame = new Phaser.Game(width, height, engine, 'content', callbacks);

		return game;
	},
	preload: function () {
		this.game.load.image('ground_32x32', './../assets/images/ninja-tiles32-purple.png');
		this.game.load.tilemap('demo-tilemap', './../assets/maps/map1.json', null, Phaser.Tilemap.TILED_JSON);
	},
	create: function () {
		this.time.advancedTiming = true;
		this.physics.startSystem(Phaser.Physics.ARCADE);
		
		this.game.plugins.add(Phaser.Plugin.ArcadeSlopes);
		this.stage.backgroundColor = '#8d549b';
		
		this.game.state.add('GameState', GameState.initialize(), false);
		this.game.state.start('GameState');
		
	}
};

export default Game;