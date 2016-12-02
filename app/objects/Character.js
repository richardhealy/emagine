import Phaser from '<shims>/Phaser';

var Character = {
	create: function (game) {
		let playerGraphics =  null,
			playerGraphicsTexture = null,
			player = null;

		playerGraphics = new Phaser.Graphics(this)
			.beginFill(Phaser.Color.hexToRGB('#e3cce9'), 1)
			.drawRect(0, 0, 16, 24);
		
		playerGraphicsTexture = playerGraphics.generateTexture();

		player = game.add.sprite(768, 2800, playerGraphicsTexture);

		return player;
	},
	setup: function (player, features) {
		// Add a touch of tile padding for the collision detection
		player.body.tilePadding.x = 1;
		player.body.tilePadding.y = 1;
		
		// Set the initial properties of the player's physics body
		player.body.drag.x = features.dragX;
		player.body.bounce.x = features.bounceX;
		player.body.bounce.y = features.bounceY;
		player.body.slopes.friction.x = features.frictionX;
		player.body.slopes.friction.y = features.frictionY;
		player.body.maxVelocity.x = 500;
		player.body.maxVelocity.y = 1000;
		player.body.collideWorldBounds = true;
		
		return player;
	}
};

export default Character;