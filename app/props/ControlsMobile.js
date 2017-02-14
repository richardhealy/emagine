import Phaser from '<shims>/Phaser';

let ControlsMobile = {
	create: function (upBtn, downBtn) {
		
		upBtn.input.onHold.add(onHold, this);

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