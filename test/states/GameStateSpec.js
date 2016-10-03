import chai from 'chai';
import PhaserMock from 'phaser-mock';

const expect =  chai.expect;
const proxyquire =  require('proxyquire').noCallThru();

const RainbowText = {};

const GameState = proxyquire('../../app/states/GameState', {
	'../objects/RainbowText': RainbowText,
	'phaser-shim': PhaserMock
}).default;

RainbowText.initialize = function () {
  let text = {
    anchor: {
      set: function (unit) {

      }
    }
  };
  return text;
}

describe('GameState', function() {
  describe('on load', function() {

  	it('the game should been initialized with text', function() {

  	  let state = null,
          text = null,
          game = {
            world: {
              centerX:0,
              centerY:0
            }
          };

      state = GameState.initialize();
      state.create(game);

      expect(state.text).to.be.a('object');

    });
  });
});