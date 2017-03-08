import Phaser from '<shims>/Phaser';

var Credits = {
	initialize: function () {
		
		let state;

		state = new Phaser.State();
		state.preload = this.preload;
		state.createCredits = this.createCredits;

		return state;
	},

	preload: function (game) {

		this.createCredits(game);
	},

	createCredits: function (game) {
		let credits = null;

		credits = game.add.text(game.width/2, game.height/2, 'CREDITS\n\nMy D-Bot ❤\nSpecial thanks to Phaser.js\n\nSFX\nTeleport: https://goo.gl/WG6Evd\nExplosion: https://goo.gl/62a9wp\Ship Boost: https://goo.gl/ieWUCI\n\nMusic\nZander Noriaga: https://goo.gl/CF7itr', { font: "12px Courier New", fill: "#ffffff", align: "center" });
		credits.anchor.setTo(0.5,0.5);

		// Create close icon
		game.add.button(game.width-30, 5, 'close', function() {
			
			game.state.start('menu');

		}, this);


	}
};

export default Credits;