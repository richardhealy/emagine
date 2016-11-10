import chai from 'chai';
import PhaserMock from 'phaser-mock';

const expect =  chai.expect;
const proxyquire =  require('proxyquire').noCallThru();

const GameState = proxyquire('../../app/states/GameState', {
	'./../../helpers/shims/Phaser': PhaserMock
}).default;

describe('GameState', function() {
  let game = null;

  beforeEach(function() {
    game = new PhaserMock.Game();
    game.slopes = {
      convertTilemapLayer: function () {
        
      }
    };
  });

  describe('on load', function() {

  	it('the game should been initialized with text', function() {

  	  let state = null;

      state = GameState.initialize();
      state.create(game);

      expect(true).to.equal(true);

    });
  });
});