import Game from './Game';

var app = {
	initialize: function () {
		this.start();
	},
	start: function () {
		this.game = Game.initialize(500, 500);
	}
};

export default app;