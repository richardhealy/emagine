import chai from 'chai';
import PhaserNoBrowser from './../helpers/shims/PhaserNoBrowser';

const expect =  chai.expect;
const proxyquire =  require('proxyquire').noCallThru();
const noop = function() {};
const GameStateStub = {};

const Game = proxyquire('../app/Game', {
	'./states/GameState': GameStateStub,
  './../helpers/shims/Phaser': PhaserNoBrowser
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

  	  let game = Game.initialize(500, 500, Phaser.AUTO, {preload:noop});

      expect(game).to.be.a('object');

    });
  });
});