import app from "./../app/app.js";

describe("App", function() {

	describe("when app is started", function() {

		beforeEach(function () {
			spyOn(app, 'start');
			app.initialize();
		});

  		it("expect application to start after initialization", function() {
  			//expect(app.start).toHaveBeenCalled();
  			 expect(true).toBe(false);
    	});
  	});
});