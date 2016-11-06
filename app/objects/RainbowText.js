import Phaser from '<shims>/Phaser';

const RainbowText = {
	initialize: function (game, x, y, message) {

		let text;

		text = new Phaser.Text(game, x, y, message);

		text._speed = 125; //ms
		text._colorIndex = 0;
		text._colors = ['#ee4035', '#f37736', '#fdf498', '#7bc043', '#0392cf'];

		text.startTimer = this.startTimer;
		text.colorize = this.colorize;

		text.colorize(text);
		text.startTimer(text);

		text.game.stage.addChild(text);

		return text;
	},
	startTimer(text) {
		
		text.game.time.events.loop(text._speed, text.colorize, this, text).timer.start();
		
	},
	colorize(text) {

		for (let i = 0; i < text.text.length; i++) {

			if (text._colorIndex === text._colors.length) {
				text._colorIndex = 0;
			}

			text.addColor(text._colors[text._colorIndex], i);
			text._colorIndex++;
		}
	}
};

export default RainbowText;