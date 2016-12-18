let Controls = {
	create: function (game) {
		
		// Map some keys for use in our update() loop
	    game.controls = game.input.keyboard.addKeys({
	        'upW': Phaser.KeyCode.W,
	        'downS': Phaser.KeyCode.S,
	        'upUP': Phaser.KeyCode.UP,
	        'downDOWN': Phaser.KeyCode.DOWN
	    });

	},

	update: function (controls, body, speed, sound) {
		if (controls.upW.isDown || controls.upUP.isDown) {
	        body.y -= speed;
	        if(!sound.isPlaying) {
	            sound.play();    
	        }
	        
	    } else if (controls.downS.isDown || controls.downDOWN.isDown) {
	        body.y += speed;
	        if(!sound.isPlaying) {
	            sound.play();    
	        }
	    } else {
            sound.stop();
	    }
	}
};

export default Controls;