var Explosion = {
	create: function (game, x, y, imageName = 'boom', frames = [0,1,2,3]) {
	    
	    let explosion = null,
	    	animation = null;

	    explosion = game.add.sprite(0, 0, 'explosion');
	    explosion.anchor.setTo(0.5, 0.5);

	    animation = explosion.animations.add(imageName, frames, 20, false);
	    animation.killOnComplete = true;

	    explosion.x = x;
	    explosion.y = y;

	    explosion.angle = game.rnd.integerInRange(60, 120);

	    explosion.animations.play(imageName);

	    return explosion;

	}
};

export default Explosion;