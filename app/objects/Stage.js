var Stage = {
	create: function (game) {
		let stage = {
				map: null,
				bgTiles: {}
		};

		stage.bgTiles.mountainsBack = game.add.tileSprite(0, 
	        game.height - game.cache.getImage('mountains-bg').height, 
	        game.width, 
	        game.cache.getImage('mountains-bg').height, 
	        'mountains-bg'
		);

		stage.bgTiles.mountainsMid1 = game.add.tileSprite(0, 
		    game.height - game.cache.getImage('mountains-mid1').height, 
		    game.width, 
		    game.cache.getImage('mountains-mid1').height, 
		    'mountains-mid1'
		);

		stage.bgTiles.mountainsMid2 = game.add.tileSprite(0, 
		    game.height - game.cache.getImage('mountains-mid2').height, 
		    game.width, 
		    game.cache.getImage('mountains-mid2').height, 
		    'mountains-mid2'
		);

		stage.bgTiles.mountainsBack.fixedToCamera = true;
		stage.bgTiles.mountainsMid1.fixedToCamera = true;
		stage.bgTiles.mountainsMid2.fixedToCamera = true;

		stage.map = game.add.tilemap('demo-tilemap');

		return stage;
	},

	createRain: function (game) {
		let rainParticle = game.add.bitmapData(15, 50),
			emitter = null;
 
	    rainParticle.ctx.rect(0, 0, 15, 50);
	    rainParticle.ctx.fillStyle = '#9cc9de';
	    rainParticle.ctx.fill();
	 
	    emitter = game.add.emitter(game.world.centerX, -300, 400);
	 
	    emitter.width = game.world.width;
	    emitter.angle = 10;
	 
	    emitter.makeParticles(rainParticle);
	 
	    emitter.minParticleScale = 0.1;
	    emitter.maxParticleScale = 0.3;
	 
	    emitter.setYSpeed(600, 1000);
	    emitter.setXSpeed(-5, 5);
	 
	    emitter.minRotation = 0;
	    emitter.maxRotation = 0;

	    emitter.fixedToCamera = true;
	    emitter.cameraOffset.x = game.world.centerX;
	    emitter.cameraOffset.y = -300;
	 
	    return emitter;
	}
};

export default Stage;