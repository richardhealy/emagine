import chai from 'chai';
import PhaserMock from 'phaser-mock';

const expect =  chai.expect;
const proxyquire =  require('proxyquire').noCallThru();

const GameStateStub = {};

const Game = proxyquire('../app/Game', {
	'./states/GameState': GameStateStub,
	'phaser-shim': PhaserMock
}).default;

GameStateStub.initialize = function () {
  let state = {
    add: function () {

    },
    create: function () {

    },
    start: function () {
      
    }
  };
  return state;
}

describe('Game', function() {
  describe('on load', function() {

  	it('the game should been initialized with a state', function() {

  	  let game = Game.initialize(500, 500);

      expect(game).to.be.a('object');

    });
  });
});