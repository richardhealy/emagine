var Effects = {
	flash: function (state, color, duration, sound) {

		state.camera.flash(color, duration);

		if (typeof sound === 'object' && typeof sound.play === 'function') {
			sound.play();	
		}
	},

	deathFlash: function (state, color, duration, callback) {

		state.camera.flash(color, duration);

		state.camera.onFlashComplete.add(callback);
	},

	fade: function (state, color, duration) {
		state.camera.fade(color, duration);
	}
};

export default Effects;