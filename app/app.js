import Game from './Game';
//import ZPlat from './../helpers/scale';

var app = {
	initialize: function () {
		this.start();
	},
	start: function () {

		//ZPlat.dim = ZPlat.getGameLandscapeDimensions(864, 600);
		this.game = Game.initialize('100%', '100%');
	}
};

export default app;