import chai from 'chai';
import PhaserMock from 'phaser-mock';

var noop = function() {};

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
      convertTilemapLayer: noop,
      enable: noop
    };
  });

  describe('on initialize', function() {

  	it('the should return a Phaser.State', function() {

      let state = GameState.initialize();

      expect(state.create).to.be.a('function');
    });
  });

  describe('on create', function() {

    it('the should create the game with state', function() {

      let state = GameState.initialize();

      state.create(game);

      expect(game).to.be.a('object');
    });
  });
});