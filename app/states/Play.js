import Phaser from '<shims>/Phaser';
import GameFactory from '../factory/GameFactory';
import Features from '../config/Features';
import Stage from '../props/Stage';
import Player from '../props/Player';
import Score from '../props/Score';
import Controls from '../props/Controls';
import DeathParticles from '../props/DeathParticles';
import GameAudio from '../props/GameAudio';

var Play = {
	initialize: function () {
		
		let state;

		state = new Phaser.State();
		state.create = this.create;
		state.update = this.update;

		state = GameFactory.generate(state);

		return state;
	},

	create: function (game) {

		let stage = null;

		// Get personal highscore
		this.highscore = localStorage.getItem('escape.highscore', 0);
	    
		// Setup stage
		stage = Stage.create(game, Phaser.Physics.ARCADE, 'bg');

		this.bg = stage.bgImage;
		this.tunnel = stage.tunnel;

		// Create player
		this.player = Player.create(game, 'ship', 70, game.height/2);

		// Setup ceiling and floor obsticles
		this.setupObsticles(game);

		// Setup particles
		this.deathParticles = DeathParticles.create(game, this.cache);

		// Setup score UI
		this.scoreUI = Score.create(game, this.highscore);

		// Setup controls
		Controls.create(game);

		this.sounds = GameAudio.create(game);
		this.sounds.bgmusic.play();

		// Setup game events;
	    game.time.events.loop(Phaser.Timer.QUARTER, this.updateScore, this);
	    game.time.events.loop(Phaser.Timer.SECOND * Features.intervalIncrease, this.increaseSpeed, this);
	    game.time.events.add(Phaser.Timer.SECOND * 30, this.setUpFlash, this, game);
	},

	update: function (game) {

		var self = this,
			playerBody = this.player.body;

		if (this.dead === true) {

			// Make sure we definitely stop the boost sound
			this.sounds.boost.stop();

			// Check for death particle collisions
			DeathParticles.checkCollision(game, this.deathParticles, this.tunnel);
	        return;
	    }

	   	// Reset the player acceleration
	    playerBody.velocity.x = 0;
	    playerBody.velocity.y = 0;

	    // Move bg 1/20th the speed extra, looks like things are speeding up
	    Stage.moveBackground(this.bg, (Features.bgSpeed + parseFloat(Features.speed / 20)));

	    // Check for player collision
		Player.checkCollision(game, this.player, this.tunnel, function () {
			self.death(game);
		});
		// Move the rocks left. We do this via the group (very handy indeed!)
	    Stage.moveObstacles(this.tunnel, Features.speed);

	    // Check to see if the controls are moving
	    Controls.update(game.controls, playerBody, Features.playerSpeed, this.sounds.boost);
	}
};

export default Play;