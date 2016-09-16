const say = {
	hello: function () {
		this.alertMessage('hello');
	},
	alertMessage: function (message) {
		console.log(message);
	}
};

export default say;