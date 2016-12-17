var Explosion = {
	create: function (game, x, y, imageName = 'boom', frames = [0,1,2,3,4,5,6,7,8,9]) {
	    
	    let explosion = null,
	    	animation = null;

	    explosion = game.add.sprite(0, 0, 'explosion');
	    explosion.anchor.setTo(0.5, 0.5);

	    animation = explosion.animations.add(imageName, frames, 10, false);
	    animation.killOnComplete = true;

	    explosion.x = x;
	    explosion.y = y;

	    explosion.angle = game.rnd.integerInRange(60, 120);

	    explosion.animations.play(imageName);

	    return explosion;

	}
};

export default Explosion;