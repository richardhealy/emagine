import Phaser from '<shims>/Phaser';
import Preload from './states/Preload';
import Load from './states/Load';
import Menu from './states/Menu';
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

		this.game.plugins.add(PhaserInput.Plugin);

		this.game.physics.startSystem(Phaser.Physics.ARCADE);

		this.game.scale.aspectRatio = 0.5;
		
		this.game.state.add('preload', Preload.initialize(), false);
		this.game.state.add('load', Load.initialize(), false);
		this.game.state.add('menu', Menu.initialize(), false);
		this.game.state.add('play', Play.initialize(), false);
		this.game.state.start('preload');
	}
};

export default Game;