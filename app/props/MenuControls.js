let MenuControls = {
	create: function (game) {

		// Map some keys for use in our update() loop
	    game.controls = game.input.keyboard.addKeys({
	        'start': Phaser.KeyCode.S
	    });

	},

	update: function (controls) {
		if (controls.start.isDown) {
	      	return true;  
	    }

	    return false;
	}
};

export default MenuControls;