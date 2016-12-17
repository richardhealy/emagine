import Phaser from '<shims>/Phaser';

var Load = {
	initialize: function () {
		
		let state;

		state = new Phaser.State();
		state.preload = this.preload;
		state.create = this.create;

		return state;
	},
	preload: function (game) {

		game.load.image('bg', './assets/images/bg.png');
		game.load.spritesheet('rock', './assets/images/block.png', 24, 500);
	    game.load.spritesheet('ship', './assets/images/ship.png');
	    game.load.spritesheet('explosion', './assets/images/explosion.png', 128, 128);
	    game.load.audio('bgmusic', './assets/audio/tension.mp3');
	    game.load.audio('boom', './assets/audio/exploding.wav');
	    game.load.audio('teleport', './assets/audio/teleport.wav');
    	game.load.audio('boost', './assets/audio/rocket.wav');

	},
	create: function (game) {
		game.stage.backgroundColor = '#000000';
	    game.world.setBounds(0, 0, 900, 600);
	    game.physics.startSystem(Phaser.Physics.ARCADE);

		game.state.start('play');
	}
};

export default Load;