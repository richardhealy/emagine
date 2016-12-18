import PlayMixin from '../states/mixins/PlayMixin';

var GameFactory = {
	generate: function (state) {

		for (var prop in PlayMixin) {
			if (PlayMixin.hasOwnProperty(prop)) {
				state[prop] = PlayMixin[prop];
			} else {
				console.error('GameFactory: `' + prop + '` already exists.');
			}
		}

		return state;
	}
};

export default GameFactory;