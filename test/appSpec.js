const chai = require('chai');
const expect =  chai.expect;
const proxyquire =  require('proxyquire').noCallThru();

const GameStub = {initialize: function () {
  let state = {};
  return state;
}};

const app = proxyquire('../app/app', {
	'./Game': GameStub
}).default;

describe('App', function() {
  describe('on load', function() {

  	it('should call an instance of a game', function() {

      app.start();

      expect(app.game).to.be.a('object');

    });
  });
});