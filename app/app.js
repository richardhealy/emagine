import Game from './Game';

var app = {
	initialize: function () {
		this.start();
	},
	start: function () {

		this.game = Game.initialize(864, 600);
	}
};

export default app;