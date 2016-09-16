import say from './say';

// app.js
const app = {
	initialize: function () {
		this.start();
	},
	start: function () {
		say.hello();	
	}
};

export default app;