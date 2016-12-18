var Player = {
	create: function (game, playerImageName, intX, intY) {

		let player = null;

		player = game.add.sprite(0, 0, playerImageName);

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
	}
};

export default Player;