import Phaser from '<shims>/Phaser';
import Features from '../config/Features';
import Stage from '../props/Stage';
import Player from '../props/Player';
import Explosion from '../props/Explosion';

var Play = {
	initialize: function () {
		
		let state;

		state = new Phaser.State();
		state.create = this.create;
		state.update = this.update;
		state.setup = this.setup;
		state.increaseSpeed = this.increaseSpeed;
		state.death = this.death;
		state.updateScore = this.updateScore;
		state.fadeComplete = this.fadeComplete;
		state.setUpFlash = this.setUpFlash;
		state.deathFlashComplete = this.deathFlashComplete;

		state.tunnel = null;
		state.bg = null;
		state.player = null;
		state.explosion = null;
		state.dead = false;
		state.highscore = localStorage.getItem('escape.highscore');
		state.scoreUI = null;
		state.score = 0;
		state.boom = null;
		state.teleport = null;
		state.boost = null;
		state.bgmusic = null;
		state.deathParticles = null;
		state.flashTimer = null;

		return state;
	},
	create: function (game) {

		let stage = Stage.create(game, Phaser.Physics.ARCADE, 'bg');

		this.bg = stage.bgImage;
		this.tunnel = stage.tunnel;

		this.player = Player.create(game, 'ship', 140, 280);

		// Map some keys for use in our update() loop
	    game.controls = game.input.keyboard.addKeys({
	        'upW': Phaser.KeyCode.W,
	        'downS': Phaser.KeyCode.S,
	        'upUP': Phaser.KeyCode.UP,
	        'downDOWN': Phaser.KeyCode.DOWN
	    });

	    this.setup(game);

	    this.scoreUI = game.add.text(game.world.width - 125, 50, 'Score: 0' + '\nHighscore: ' + this.highscore, { font: "15px Courier New", fill: "#ffffff", align: "right" });
	    this.scoreUI.anchor.setTo(0.5, 0.5);

		this.deathParticles = game.add.emitter(0, 0, 100);

		// Particle graphics
		var particleGraphics = new Phaser.Graphics(this)
			.beginFill(Phaser.Color.hexToRGB('#e58b04'), 0.8)
			.drawCircle(0, 0, 4);
			
			// Cache the particle graphics as an image
		this.cache.addImage('particle', null, particleGraphics.generateTexture().baseTexture.source);

    	this.deathParticles.makeParticles('particle');
    	this.deathParticles.gravity = 200;
    	this.deathParticles.bounce.set(1, 1);
		this.deathParticles.width = 4;
		this.deathParticles.height = 4;
		this.deathParticles.setXSpeed(100, 1000);

		// Update the speed
	    game.time.events.loop(Phaser.Timer.QUARTER, this.updateScore, this);
	    game.time.events.loop(Phaser.Timer.SECOND * Features.intervalIncrease, this.increaseSpeed, this);
	    game.time.events.add(Phaser.Timer.SECOND * 30, this.setUpFlash, this, game);

	    // Add Sounds
	    this.boom = game.add.audio('boom');
	    this.bgmusic = game.add.audio('bgmusic');
	    this.boost = game.add.audio('boost');
	    this.teleport = game.add.audio('teleport');
	    this.bgmusic.play();
	},
	update: function (game) {

		var self = this;

		if (this.dead === true) {

			// Make sure we definitely stop the boost sound
			this.boost.stop();
	        return;
	    }

	    // Move bg
	    Stage.moveBackground(this.bg, (Features.bgSpeed + parseFloat(Features.speed/20)));

	    // Check the collisions
	    game.physics.arcade.collide(this.player, this.tunnel, function () {
	    	self.death(game);
	    });

	    // Define some shortcuts to some useful objects
	    var playerBody = this.player.body;
	    var controls = this.game.controls;

	    // Reset the player acceleration
	    playerBody.velocity.x = 0;
	    playerBody.velocity.y = 0;

	    this.tunnel.forEach(function(item) {
	        item.x -= Features.speed;
	    });

	    // Accelerate or jump up
	    if (controls.upW.isDown || controls.upUP.isDown) {
	        playerBody.y -= Features.playerSpeed;
	        if(!this.boost.isPlaying) {
	            this.boost.play();    
	        }
	        
	    } else if (controls.downS.isDown || controls.downDOWN.isDown) {
	        playerBody.y += Features.playerSpeed;
	        if(!this.boost.isPlaying) {
	            this.boost.play();    
	        }
	    } else {
            this.boost.stop();
	    }
	},
	setup(game) {
		let i = 0;

		for (i = 0; i < Features.spritesPerRowPlusBuffer; i++) {
	        Stage.createRock(game, this.tunnel, parseInt(i * Features.rockWidth,10), (Features.ceiling[i] * 24) - Features.rockHeight, Stage.switchCeiling, this, Features);
	    }

	    for (i = 0; i < Features.spritesPerRowPlusBuffer; i++) {
	        Stage.createRock(game, this.tunnel, parseInt(i * Features.rockWidth,10), game.height - ((Features.ceiling[i] + 1) * 24), Stage.switchFloor, this, Features);
	    }
	},

	increaseSpeed() {
	    Features.speed = Features.speed + 1;
	},

	death(game) {

		let self = this;

	    if (this.dead === true) {
	        return;
	    }

	    game.time.events.removeAll();

	    this.flashTimer = null;

	    this.dead = true;
	    this.boom.play();
	    this.camera.flash(0xff0000, 200);
	    this.bgmusic.fadeOut(2500);
	    
	    Explosion.create(game, this.player.x + this.player.body.width, this.player.y);

	    this.deathParticles.x = this.player.x + this.player.body.halfWidth;
		this.deathParticles.y = this.player.y + this.player.body.halfHeight;
	    this.deathParticles.start(true, 2000, null, 10);
	    this.player.kill();

	    this.camera.onFlashComplete.add(function () {
	    	self.deathFlashComplete(game);
	    }, this);
	},

	deathFlashComplete: function (game) {

		this.camera.onFlashComplete.removeAll();

		game.add.text(game.world.centerX, game.world.centerY, 'You Failed to Escape.\nScore: ' + this.score , {
            fontSize: 34,
            fill: '#ffffff',
            align:'center'
        }).anchor.setTo(0.5, 0.5);

		this.camera.fade('#000000', 4000);
	    this.camera.onFadeComplete.add(this.fadeComplete, this);
	},
    
    fadeComplete: function () {
    	if (this.highscore < this.score) {
    		this.highscore = this.score;
    		localStorage.setItem('escape.highscore',this.highscore);
    	}

    	// Reset values
		this.score = 0;
		this.dead = false;
		this.tunnel.removeAll();
		Features.speed = 1;
		Features.ceiling = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,8,8,8,1,1,1,1];
    	Features.floor = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,8,8,8,1,1,1,1];


		this.state.start('play'); 
	},

	setUpFlash: function (game) {

		if(this.dead === true) {
			return;
		}

		this.camera.flash(0xffffff, 300);
		this.teleport.play();

		game.time.events.remove(this.setUpFlash);

		game.time.events.add(game.rnd.integerInRange(1000, 45000), this.setUpFlash, this, game);
	},
	updateScore() {

	    if (this.dead === true) {
	        return;
	    }

	    this.score = this.score + 1;

	    this.scoreUI.setText('Score: ' + this.score + '\nHighscore: ' + this.highscore);
	}
};

export default Play;