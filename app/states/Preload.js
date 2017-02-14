import Phaser from '<shims>/Phaser';

var Preload = {
	initialize: function () {
		
		let state;

		state = new Phaser.State();
		state.preload = this.preload;
		state.create = this.create;

		return state;
	},
	preload: function (game) {

		game.load.image('loader', './assets/images/ui/loading.png');

	},
	create: function (game) {
		game.state.start('load');
	}
};

export default Preload;