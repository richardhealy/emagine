var Score = {
	create: function (game, highscore) {
		
		let scoreUI = null;

		this.score = 0;

		scoreUI = game.add.text(game.width - 190, 10, 'Score: 0' + '\n Your Highscore: ' + highscore, { font: "15px Courier New", fill: "#ffffff", align: "right" });

	    return scoreUI;
	},

	update: function (scoreUI, score, highscore) {

		this.score = score;

		scoreUI.setText('Score: ' + score + '\n Your Highscore: ' + highscore);
	},

	getHighscore: function () {

		return fetch("http://healy.rocks/games/escape/api/score.php", {mode: "cors"})
			.then(function(response) {
				return response;
			});
	},

	setHighscore: function (name, highscore) {
		
		let data = {
				name:name,
				score:highscore
			},
			fd = new FormData();
		
		for(var i in data){
		   fd.append(i,data[i]);
		}

		fetch("http://healy.rocks/games/escape/api/score.php", {
			method: "POST",
			mode: "cors",
			body: fd
		});
	}
};

export default Score;