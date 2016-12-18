import Features from '../../config/Features';
import Stage from '../../props/Stage';
import Player from '../../props/Player';
import Explosion from '../../props/Explosion';
import Score from '../../props/Score';
import DeathParticles from '../../props/DeathParticles';
import Effects from '../../props/Effects';

let PlayMixin = {
	tunnel:null,
	bg: null,
	player: null,
	explosion: null,
	dead: false,
	highscore: localStorage.getItem('escape.highscore'),
	scoreUI: null,
	score: 0,
	deathParticles: null,
	sounds: {
		boom:null,
		teleport: null,
		boost: null,
		bgmusic: null
	},

	setupObsticles: function (game) {

		let i = 0;

		for (i = 0; i < Features.spritesPerRowPlusBuffer; i++) {
	        Stage.createRock(game, this.tunnel, parseInt(i * Features.rockWidth,10), (Features.ceiling[i] * 24) - Features.rockHeight, Stage.switchCeiling, this, Features);
	    }

	    for (i = 0; i < Features.spritesPerRowPlusBuffer; i++) {
	        Stage.createRock(game, this.tunnel, parseInt(i * Features.rockWidth,10), game.height - ((Features.ceiling[i] + 1) * 24), Stage.switchFloor, this, Features);
	    }
	},

	increaseSpeed: function () {

	    Features.speed = Features.speed + 1;

	},

    fadeComplete: function () {
    	if (this.highscore < this.score) {
    		this.highscore = this.score;
    		localStorage.setItem('escape.highscore',this.highscore);
    	}

    	this.reset();

		this.state.start('play'); 
	},

	setUpFlash: function (game) {

		Effects.flash(this, 0xffffff, 300, this.sounds.teleport);

		game.time.events.remove(this.setUpFlash);

		game.time.events.add(game.rnd.integerInRange(1000, 45000), this.setUpFlash, this, game);
	},

	updateScore: function () {

	    if (this.dead === true) {
	        return;
	    }

	    this.score = this.score + 1;

	    Score.update(this.scoreUI, this.score, this.highscore);
	},

	reset: function () {

		// Reset values
		this.score = 0;
		this.dead = false;
		this.tunnel.removeAll();

		Features.speed = 1;
		Features.ceiling = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,8,8,8,1,1,1,1];
    	Features.floor = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,8,8,8,1,1,1,1];

	},

	death: function (game) {

		let self = this;

	    if (this.dead === true) {
	        return;
	    }

	    // Damn, you died!
	    this.dead = true;

	    // Remove all game events
	    game.time.events.removeAll();

	    Effects.deathFlash(self, 0xff0000, 200, function () {
	    	self.deathFlashComplete(game);
	    });

	    this.sounds.boom.play();
		this.sounds.bgmusic.fadeOut(2500);

	    Explosion.create(game, this.player.x + this.player.body.width, this.player.y);
	    
	    DeathParticles.emit(this.deathParticles, this.player.x + this.player.body.halfWidth, this.player.y + this.player.body.halfHeight)

	    Player.kill(this.player);
	},

	deathFlashComplete: function (game) {

		this.camera.onFlashComplete.removeAll();

		game.add.text(game.world.centerX, game.world.centerY, 'You Failed to Escape.\nScore: ' + this.score , {
            fontSize: 34,
            fill: '#ffffff',
            align:'center'
        }).anchor.setTo(0.5, 0.5);

		Effects.fade(this, '#000000', 4000);

	    this.camera.onFadeComplete.add(this.fadeComplete, this);
	}
};

export default PlayMixin;