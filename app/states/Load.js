import Phaser from '<shims>/Phaser';
import Features from './../config/Features';
import Utils from './../../helpers/Utils';

var Load = {
	initialize: function () {
		
		let state;

		state = new Phaser.State();
		state.preload = this.preload;
		state.create = this.create;

		return state;
	},
	preload: function (game) {

		let loadingBar;

		loadingBar = this.add.sprite(game.width/2, game.height/2, "loader");
		loadingBar.anchor.setTo(0.5,0.5);

        game.load.setPreloadSprite(loadingBar);

        game.load.spritesheet('ship', './assets/images/ship.png', 40, 22, 3);
	    game.load.spritesheet('explosion', './assets/images/explosion.png', 128, 128);
		game.load.image('bg', './assets/images/bg.png');
		game.load.image('rock', './assets/images/block.png');
	    game.load.image('titlescreen', './assets/images/ui/title.png');
	    game.load.image('logo', './assets/images/ui/logo.png');
	    game.load.image('button', './assets/images/ui/check.png');
	    game.load.image('info', './assets/images/ui/info.png');
	    game.load.image('close', './assets/images/ui/close.png');
	    game.load.image('up', './assets/images/ui/up.png');
	    game.load.image('down', './assets/images/ui/down.png');
	    game.load.audio('bgmusic', './assets/audio/tension.mp3');
	    game.load.audio('boom', './assets/audio/exploding.wav');
	    game.load.audio('teleport', './assets/audio/teleport.wav');
    	game.load.audio('boost', './assets/audio/rocket.wav');

	},
	create: function (game) {

		let screenDims = Utils.ScreenUtils.calculateScreenMetrics(Features.originalGameWidth, Features.originalGameHeight, Utils.Orientation.LANDSCAPE);

		game.stage.backgroundColor = '#000000';
	    game.world.setBounds(0, 0, parseInt(screenDims.windowWidth * 1.2, 10), screenDims.windowHeight);
	    game.physics.startSystem(Phaser.Physics.ARCADE);

		game.state.start('menu');
	}
};

export default Load;