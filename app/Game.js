import Phaser from '<shims>/Phaser';
import Load from './states/Load';
import Play from './states/Play';

const Game = {
	initialize: function (width, height, engine = Phaser.AUTO, callbacks = {
			preload: this.preload, 
			create:this.create, 
	}) {
		var game = {};

		game.phaserGame = new Phaser.Game(width, height, engine, 'game', callbacks);
		return game;
	},
	create: function () {
		this.game.physics.startSystem(Phaser.Physics.ARCADE);		
		
		this.game.state.add('load', Load.initialize(), false);
		this.game.state.add('play', Play.initialize(), false);
		this.game.state.start('load');
	}
};

export default Game;