import Phaser from '<shims>/Phaser';
import RainbowText from '../objects/RainbowText';

var GameState = {
	initialize: function () {
		
		let state;

		this.text = null;

		state = new Phaser.State();
		state.create = this.create;

		return state;
	},
	create: function (game) {
		var center;

		center = { 
			x: game.world.centerX, 
			y: game.world.centerY 
		};

		this.text = RainbowText.initialize(game, center.x, center.y, "- phaser -\nwith a sprinkle of\nES6 dust!");
		this.text.anchor.set(0.5);
	}
};

export default GameState;