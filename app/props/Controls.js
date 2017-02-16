import Phaser from '<shims>/Phaser';

let Controls = {
	create: function (game) {
		
		let self = this,
			up, down;
		
		this.upState = false; 
		this.downState = false;

		// Map some keys for use in our update() loop
	    game.controls = game.input.keyboard.addKeys({
	        'upW': Phaser.KeyCode.W,
	        'downS': Phaser.KeyCode.S,
	        'upUP': Phaser.KeyCode.UP,
	        'downDOWN': Phaser.KeyCode.DOWN
	    });

	    up = game.add.button(game.width - 74, game.height - 142, 'up');
		up.onInputDown.add(function () {
			self.upState = true;
		});
		up.onInputUp.add(function () {
			self.upState = false;
		});

	    down = game.add.button(game.width - 74, game.height - 74, 'down');
		down.onInputDown.add(function () {
	    	self.downState = true;
		});
		down.onInputUp.add(function () {
	    	self.downState = false;
		});
	},

	update: function (controls, body, speed, sound) {

		if (controls.upW.isDown || controls.upUP.isDown || this.upState === true) {
	        this.movePlayerUp(body, speed, sound);
	    } else if (controls.downS.isDown || controls.downDOWN.isDown || this.downState === true) {
	        this.movePlayerDown(body, speed, sound);
	    } else {
	    	if (sound.isPlaying) {
            	sound.stop();	
	    	}
	    }
	},

	movePlayerUp: function (body, speed, sound) {

		body.y -= speed;
        if(!sound.isPlaying) {
            sound.play();    
        }
	},


	movePlayerDown: function (body, speed, sound) {
		body.y += speed;
        if(!sound.isPlaying) {
            sound.play();    
        }
	},
};

export default Controls;