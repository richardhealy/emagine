var Player = {
	create: function (game, playerImageName, intX, intY) {

		let player = null,
	    	staticAnimation = null,
	    	boostAnimation = null;

		player = game.add.sprite(0, 0, 'ship');
		
		staticAnimation = player.animations.add('static', [0], 1, false);
		boostAnimation = player.animations.add('boost', [1, 2], 10, true);
		boostAnimation.onLoop.add(this.animationLooped, game);
	    
	    // Enable physics for the player
	    game.physics.arcade.enable(player);

	    player.body.collideWorldBounds = true;

	    // Position the player
	    player.position.set(intX, intY);

	    return player;

	},

	checkCollision: function (game, player, obsticles, callback) {

	    // Check the collisions
	    game.physics.arcade.collide(player, obsticles, function () {
	    	callback();
	    });
	},

	kill: function (player) {

	    player.kill();
	},

	animationLooped: function (sprite, animation) {

	    if (animation.loopCount === 2) {
	        sprite.animations.play('static');
	    }
	}
};

export default Player;