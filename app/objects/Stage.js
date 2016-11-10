var Stage = {
	create: function (game) {
		const map = game.add.tilemap('demo-tilemap');
		
		return map;
	}
};

export default Stage;