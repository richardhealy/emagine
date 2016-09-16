import say from "./../app/say.js";

describe("Say", function() {

	describe("when we want to say something", function() {

  		it("expect the message to be alerted to the user.", function() {

  			spyOn(say, 'alertMessage');
			
			say.hello();

  			expect(say.alertMessage).toHaveBeenCalled();
    	});
  	});
});