import chai from 'chai';
import path from 'path';
import PhaserNoBrowser from './../../helpers/shims/PhaserNoBrowser';

const noop = function() {};
const expect =  chai.expect;
const proxyquire =  require('proxyquire').noCallThru();

const GameState = proxyquire('../../app/states/GameState', {
	'./../helpers/shims/Phaser': PhaserNoBrowser,
}).default;

describe('GameState', function() {
  
  describe('on initialize', function() {

  	it('should return a Phaser.State', function() {

      let state = GameState.initialize();

      expect(state.create).to.be.a('function');

    });
  });
});