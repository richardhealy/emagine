import Phaser from '<shims>/Phaser';
import Stage from '../objects/Stage';

var GameState = {
	initialize: function () {
		
		let state;

		this.text = null;

		state = new Phaser.State();
		state.create = this.create;

		return state;
	},
	create: function (game) {
		var stage = Stage.create(game),
			ground = null;

		stage.addTilesetImage('collision', 'ground_32x32');

		ground = stage.createLayer('collision');
		
		game.slopes.convertTilemapLayer(ground, {
				2:  'FULL',
				3:  'HALF_BOTTOM_LEFT',
				4:  'HALF_BOTTOM_RIGHT',
				6:  'HALF_TOP_LEFT',
				5:  'HALF_TOP_RIGHT',
				15: 'QUARTER_BOTTOM_LEFT_LOW',
				16: 'QUARTER_BOTTOM_RIGHT_LOW',
				17: 'QUARTER_TOP_RIGHT_LOW',
				18: 'QUARTER_TOP_LEFT_LOW',
				19: 'QUARTER_BOTTOM_LEFT_HIGH',
				20: 'QUARTER_BOTTOM_RIGHT_HIGH',
				21: 'QUARTER_TOP_RIGHT_HIGH',
				22: 'QUARTER_TOP_LEFT_HIGH',
				23: 'QUARTER_LEFT_BOTTOM_HIGH',
				24: 'QUARTER_RIGHT_BOTTOM_HIGH',
				25: 'QUARTER_RIGHT_TOP_LOW',
				26: 'QUARTER_LEFT_TOP_LOW',
				27: 'QUARTER_LEFT_BOTTOM_LOW',
				28: 'QUARTER_RIGHT_BOTTOM_LOW',
				29: 'QUARTER_RIGHT_TOP_HIGH',
				30: 'QUARTER_LEFT_TOP_HIGH',
				31: 'HALF_BOTTOM',
				32: 'HALF_RIGHT',
				33: 'HALF_TOP',
				34: 'HALF_LEFT'
			});

	}
};

export default GameState;