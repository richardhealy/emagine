var Score = {
	create: function (game, highscore) {
		
		let score = null;

		score = game.add.text(game.world.width - 125, 50, 'Score: 0' + '\nHighscore: ' + highscore, { font: "15px Courier New", fill: "#ffffff", align: "right" });
	    score.anchor.setTo(0.5, 0.5);

	    return score;
	},

	update: function (scoreUI, score, highscore) {
		scoreUI.setText('Score: ' + score + '\nHighscore: ' + highscore);
	}
};

export default Score;