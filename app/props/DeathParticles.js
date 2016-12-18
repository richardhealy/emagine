import Phaser from '<shims>/Phaser';

let DeathParticles = {
	create: function (game, cache) {

		let deathParticles = null,
			particleGraphics = null;

		deathParticles = game.add.emitter(0, 0, 100);

		// Particle graphics
		particleGraphics = new Phaser.Graphics(this)
			.beginFill(Phaser.Color.hexToRGB('#e58b04'), 0.8)
			.drawCircle(0, 0, 4);
			
			// Cache the particle graphics as an image
		cache.addImage('particle', null, particleGraphics.generateTexture().baseTexture.source);

    	deathParticles.makeParticles('particle');
    	deathParticles.gravity = 200;
    	deathParticles.bounce.set(1, 1);
		deathParticles.width = 4;
		deathParticles.height = 4;
		deathParticles.setXSpeed(100, 1000);

		return deathParticles;
	},

	emit: function (deathParticles, x, y) {
		deathParticles.x = x;
		deathParticles.y = y;
	    deathParticles.start(true, 2000, null, 10);
	}
};

export default DeathParticles;