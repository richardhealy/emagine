import Phaser from '<shims>/Phaser';
import Features from '../config/Features';
import Stages from '../config/Stages';

var Play = {
	initialize: function () {
		
		let state;

		state = new Phaser.State();
		state.create = this.create;
		state.update = this.update;
		state.setup = this.setup;
		state.generateTunnel = this.generateTunnel;
		state.useStage = this.useStage;
		state.createRock = this.createRock;
		state.switchCeiling = this.switchCeiling;
		state.switchFloor = this.switchFloor;
		state.increaseSpeed = this.increaseSpeed;
		state.death = this.death;
		state.getExplosion = this.getExplosion;
		state.updateScore = this.updateScore;
		state.generatePreBuffers = this.generatePreBuffers;
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

	    // Background
		this.bg = game.add.tileSprite(0, 0, 
	        game.width, 
	        game.height, 
	        'bg'
		);
		this.bg.fixedToCamera = true;

		this.player = game.add.sprite(0, 0, 'ship');

	    // Enable physics for the player
	    game.physics.arcade.enable(this.player);

	    this.player.body.collideWorldBounds = true;

	    this.tunnel = game.add.group();
	    this.tunnel.enableBody = true;
	    this.tunnel.physicsBodyType = Phaser.Physics.ARCADE;

	    // Position the player
	    this.player.position.set(140, 280);

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
	    this.bg.tilePosition.x -= (0.75 + parseFloat(Features.speed/20));

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
	        this.createRock(parseInt(i * Features.rockWidth,10), (Features.ceiling[i] * 24) - Features.rockHeight, this.switchCeiling, game);
	    }

	    for (i = 0; i < Features.spritesPerRowPlusBuffer; i++) {
	        this.createRock(parseInt(i * Features.rockWidth,10), game.height - ((Features.ceiling[i] + 1) * 24), this.switchFloor, game);
	    }
	},
	generateTunnel(game) {
	    var lastCeiling = Features.ceiling[Features.ceiling.length-1],
	        lastFloor = Features.floor[Features.floor.length-1],
	        heightCeiling = 1,
	        heightFloor = 1,
	        firstTemp = null;
	    
	    firstTemp = Features.ceiling.shift();
    	firstTemp = Features.floor.shift();
    
    	if (Features.bufferCeiling.length > 0) {
    		heightCeiling = Features.bufferCeiling.shift();
    	} else {
    		heightCeiling = game.rnd.integerInRange(Math.max(1,lastCeiling-1), Math.min(lastCeiling+1, Features.maxHeight));	
    	}

    	if (Features.bufferFloor.length > 0) {
    		heightFloor = Features.bufferFloor.shift();
    	} else {    
		    heightFloor = game.rnd.integerInRange(Math.max(1,lastFloor-1), Math.min(lastFloor+1, Features.maxHeight));
		}

	    while((heightCeiling + heightFloor) > 19) {
	        heightCeiling = heightCeiling - 1;
	        heightFloor = heightFloor - 1;
	    }

	    Features.ceiling.push(heightCeiling);
	    Features.floor.push(heightFloor);
	},
	useStage: function (game) {

		let ceiling = [],
			floor = [],
			preBuffers = null,
			stagePosition = game.rnd.integerInRange(0, Stages.count-1);

		preBuffers = this.generatePreBuffers();

		Array.prototype.push.apply(ceiling, preBuffers.ceiling);
		Array.prototype.push.apply(floor, preBuffers.floor);

		Array.prototype.push.apply(ceiling, Stages[stagePosition].ceiling);
		Array.prototype.push.apply(floor, Stages[stagePosition].floor);

		Features.bufferCeiling = ceiling;
		Features.bufferFloor = floor;
	},
	generatePreBuffers: function () {
		let buffer = {
				"ceiling":[],
				"floor":[]
			},
			lastCeilingPosition = 1,
			lastFloorPosition = 1,
			ceilingSteps = 1,
			floorSteps = 1,
			equalizerSteps = 0;
		
		ceilingSteps = lastCeilingPosition = Features.ceiling[Features.ceiling.length-1];
		floorSteps = lastFloorPosition = Features.floor[Features.floor.length-1]; 
		
		while(lastCeilingPosition > 1) {
			buffer.ceiling.push(lastCeilingPosition);
			lastCeilingPosition--;
		}

		while(lastFloorPosition > 1) {
			buffer.floor.push(lastFloorPosition);
			lastFloorPosition--;
		}

		if (ceilingSteps > floorSteps) {
			
			equalizerSteps = ceilingSteps - floorSteps;

			while(equalizerSteps > 1) {
				buffer.floor.push(1);
				equalizerSteps--;
			}

		} else if (ceilingSteps < floorSteps) {
			
			equalizerSteps = floorSteps - ceilingSteps;

			while(equalizerSteps > 1) {
				buffer.ceiling.push(1);
				equalizerSteps--;
			}

		}

		return buffer;
	},
	createRock(x, y, callback, game) {
	    var self = this,
	        rock = this.tunnel.create(x, y, 'rock');

	    rock.checkWorldBounds = true;
	    rock.events.onOutOfBounds.add(callback, self, 0, game);
	},
	switchCeiling(rock, game) {
	    var lastCeiling = null,
	    	useStage = game.rnd.integerInRange(0, Features.usedStageRandomness);

	    if (Features.bufferCeiling.length === 0 && useStage > Features.usedStageRandomness - 10) {
			
			this.useStage(game);

	    }
	    	
	    lastCeiling = Features.ceiling[Features.ceiling.length-1];
	    
	   	this.generateTunnel(game);

	    rock.x = (Features.rockWidth * Features.spritesPerRowPlusBuffer) + rock.x;
	    rock.y = (lastCeiling * 24) - Features.rockHeight;
	},
	switchFloor(rock, game) {

	    var lastFloor = null;

	    // Generation is handled in switchCeiling
	    lastFloor = Features.floor[Features.floor.length-1];
	    
	    rock.x = (Features.rockWidth * Features.spritesPerRowPlusBuffer) + rock.x;
	    rock.y = game.height - ((lastFloor + 1) * 24); 
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
	    this.explosion = this.getExplosion(game, this.player.x, this.player.y);
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

	getExplosion(game, x, y) {
	    
	    let explosion = null,
	    	animation = null;

	    explosion = game.add.sprite(0, 0, 'explosion');
	    explosion.anchor.setTo(0.5, 0.5);

	    animation = explosion.animations.add('boom', [0,1,2,3,4,5,6,7,8,9], 100, false);
	    animation.killOnComplete = true;

	    explosion.x = x;
	    explosion.y = y;

	    explosion.angle = game.rnd.integerInRange(0, 360);

	    explosion.animations.play('boom');

	    return explosion;
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