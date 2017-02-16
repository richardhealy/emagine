import Phaser from '<shims>/Phaser';
import MenuControls from '../props/MenuControls';
import Score from '../props/Score';

var Menu = {
	initialize: function () {
		
		let state;

		state = new Phaser.State();
		state.preload = this.preload;
		state.update = this.update;
		state.createMenuOptions = this.createMenuOptions;

		return state;
	},

	preload: function (game) {

		let titleScreen = null,
			logo = null;
		
		titleScreen = this.add.sprite(game.width/2, game.height/2, "titlescreen");
		titleScreen.anchor.setTo(0.5,0.5);
		titleScreen.inputEnabled = true;
		titleScreen.events.onInputDown.add(function () {
			game.state.start('play');
		});

		logo = this.add.sprite(game.width/2, game.height-80, "logo");
		logo.anchor.setTo(0.5,0.5);
		logo.inputEnabled = true;
		logo.events.onInputDown.add(function () {
			game.state.start('play');
		});

		this.createMenuOptions(game);
	},

	createMenuOptions: function (game) {
		let start = null;

		start = game.add.text(game.width - 220, 10, 'TOUCH TO START\n', { font: "24px Courier New", fill: "#ffffff", align: "right" });
	    start.alpha = 0;

		Score.getHighscore().then(function (response) {
			
			response.json().then(function (data) {

				start.setText('TOUCH TO START\n1st ' + data.name + ' ' + data.score);

				// Set game top score
				game.topscore = data.score;
			});
		});

    	game.add.tween(start).to( { alpha: 1 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

		MenuControls.create(game);

	    return start;
	},

	update: function (game) {

		if(MenuControls.update(game.controls) === true) {
			game.state.start('play');
		}
	}
};

export default Menu;