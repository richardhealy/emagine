let Audio = {
	create: function (game) {
		let sounds = {
			boom:null,
			teleport: null,
			boost: null,
			bgmusic: null
		};

		// Add Sounds
	    sounds.boom = game.add.audio('boom');
	    sounds.bgmusic = game.add.audio('bgmusic');
	    sounds.boost = game.add.audio('boost');
	    sounds.teleport = game.add.audio('teleport');
	 
	 	return sounds;   
	}
};

export default Audio;