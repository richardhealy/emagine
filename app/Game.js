import Phaser from 'phaser-shim';
import GameState from './states/GameState';

const Game = {
	initialize: function (width, height) {
		var game = {};
		
		game.phaserGame = new Phaser.Game(width, height, Phaser.AUTO, 'content');
		game.phaserGame.state.add('GameState', GameState.initialize(), false);
		game.phaserGame.state.start('GameState');

		return game;
	}
};

export default Game;