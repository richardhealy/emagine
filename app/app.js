import Game from './Game';

var app = {
	initialize: function () {
		this.start();
	},
	start: function () {
		this.game = Game.initialize('100', '100');
	}
};

export default app;