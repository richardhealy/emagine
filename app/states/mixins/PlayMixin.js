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
	highscore: 0,
	scoreUI: null,
	score: 0,
	deathParticles: null,
	deathCount:0,
	sounds: {
		boom:null,
		teleport: null,
		boost: null,
		bgmusic: null
	},

	setupObsticles: function (game) {

		let i = 0;

		for (i = 0; i < Features.spritesPerRowPlusBuffer; i++) {
	        Stage.createRock(game, this.tunnel, parseInt(i * Features.rockWidth,10), (Features.ceiling[i] * 12) - Features.rockHeight, Stage.switchCeiling, this, Features);
	    }

	    for (i = 0; i < Features.spritesPerRowPlusBuffer; i++) {
	        Stage.createRock(game, this.tunnel, parseInt(i * Features.rockWidth,10), game.height - ((Features.ceiling[i] + 1) * 12), Stage.switchFloor, this, Features);
	    }
	},

	increaseSpeed: function () {

	    Features.speed = Features.speed + 1;

	    this.player.animations.play('boost');

	},

    fadeComplete: function (game, name) {

    	let self = this,
    		t = null;

    	if (this.highscore < this.score) {
    		
    		this.highscore = this.score;
    		localStorage.setItem('escape.highscore',this.score);
    	}

    	if (game.topscore < this.score && name.length > 0 &&  name.length <= 3 ) {
    		
    		game.topscore = this.score;
    		Score.setHighscore(name, this.score);
    	}


    	if ( this.deathCount%3 === 0) { // show add after 3 deaths

    		admob.requestInterstitialAd();

			t = setTimeout(function () {
	    		self.reset();
				self.state.start('menu');
	    	}, 3000);

    	} else {
    		this.reset();
			this.state.start('menu');
    	}
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
		
    	// Remove all flashes
    	this.camera.onFlashComplete.removeAll();

		Features.speed = 1;
		Features.ceiling = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,10,10,10,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
    	Features.floor = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,10,10,10,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];

	},

	death: function (game) {

		let self = this;

	    if (this.dead === true) {
	        return;
	    }

	    // Damn, you died!
	    this.dead = true;
	    this.deathCount++;

	    // Remove all game events
	    game.time.events.removeAll();

	    Effects.deathFlash(self, 0xff0000, 200, function () {
	    	
	    	if(game.topscore < self.score) {
	    		self.getHighscoreName(game);
	    	} else {
	    		self.deathFlashComplete(game);	
	    	}
	    	
	    });

	    this.sounds.boom.play();
		this.sounds.bgmusic.fadeOut(2500);

	    Explosion.create(game, this.player.x + this.player.body.width, this.player.y);
	    
	    DeathParticles.emit(this.deathParticles, this.player.x + this.player.body.halfWidth, this.player.y + this.player.body.halfHeight);

	    Player.kill(this.player);
	},

	deathFlashComplete: function (game) {

		game.add.text(game.width/2, game.height/2, 'You Failed to Escape.\nScore: ' + this.score , {
            fontSize: 34,
            fill: '#ffffff',
            align:'center'
        }).anchor.setTo(0.5, 0.5);

		Effects.fade(this, '#000000', 4000);

	    this.camera.onFadeComplete.add(this.fadeComplete, this, 0, game);
	},

	getHighscoreName: function (game) {

		let text = null,
			nameInput = null,
			submitBtn = null,
			self = this;

		text = game.add.text(game.width/2, (game.height/2)-115, 'New Highscore\nScore: ' + this.score , {
            fontSize: 34,
            fill: '#ffffff',
            align:'center'
        }).anchor.setTo(0.5, 0.4);

        nameInput = game.add.inputField((game.width/2)-90, (game.height/2)-50, {
		    font: '24px Arial',
		    backgroundColor: '#333333',
		    fill: '#dddddd',
		    fontWeight: 'bold',
		    max: 3,
		    width: 65,
		    padding: 20,
		    borderWidth: 4,
		    borderColor: '#444444',
		    borderRadius: 6
		});
		
		submitBtn = game.add.button((game.width/2)+30, (game.height/2)-48, 'button', function() {
			
			self.fadeComplete(game, nameInput.value);
			
			nameInput.destroy();
			submitBtn.destroy();

		}, this, 0, 1, 2);
	}
};

export default PlayMixin;