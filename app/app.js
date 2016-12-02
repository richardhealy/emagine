import Scale from './Scale';
import Game from './Game';

var app = {
	initialize: function () {
		this.start();
	},
	start: function () {

		let dim = Scale.getGameLandscapeDimensions(3200, 640);

		this.game = Game.initialize(dim.w, dim.h);
	}
};

export default app;