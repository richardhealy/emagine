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

		let loadingBar;

		loadingBar = this.add.sprite(game.width/2, game.height/2, "loader"),
		loadingBar.anchor.setTo(0.5,0.5);

        game.load.setPreloadSprite(loadingBar);

		game.load.image('bg', './assets/images/bg.png');
		game.load.spritesheet('rock', './assets/images/block.png', 12, 500);
	    game.load.spritesheet('ship', './assets/images/shipsmall.png', 32, 17, 3);
	    game.load.spritesheet('explosion', './assets/images/explosionsmall.png', 100, 100);
	    game.load.spritesheet('titlescreen', './assets/images/ui/titlenotextmediumlong.png', 1024, 600);
	    game.load.spritesheet('logo', './assets/images/ui/logosmallmedium.png', 700, 131);
	    game.load.spritesheet('button', './assets/images/ui/check.png', 64, 64);
	    game.load.spritesheet('up', './assets/images/ui/upsmall.png', 96, 96);
	    game.load.spritesheet('down', './assets/images/ui/downsmall.png', 96, 96);
	    game.load.audio('bgmusic', './assets/audio/tension.mp3');
	    game.load.audio('boom', './assets/audio/exploding.wav');
	    game.load.audio('teleport', './assets/audio/teleport.wav');
    	game.load.audio('boost', './assets/audio/rocket.wav');

	},
	create: function (game) {
		game.stage.backgroundColor = '#000000';
	    game.world.setBounds(0, 0, 900, 600);
	    game.physics.startSystem(Phaser.Physics.ARCADE);

		game.state.start('menu');
	}
};

export default Load;