import Phaser from '<shims>/Phaser';
import Preload from './states/Preload';
import Load from './states/Load';
import Menu from './states/Menu';
import Play from './states/Play';
import Credits from './states/Credits';
import Features from './config/Features';
import Utils from './../helpers/Utils';

const Game = {
	initialize: function (width, height, engine = Phaser.AUTO, callbacks = {
			preload: this.preload, 
			create:this.create, 
	}) {

		let game = {},
			self = this;

		game.phaserGame = new Phaser.Game(width, height, engine, 'game', callbacks);
		
		game.phaserGame.device.whenReady(function () {
			if (game.phaserGame.device.cordova || game.phaserGame.device.crosswalk) {
				if (typeof admob !== 'undefined' && admob) {
					self.setupAdMob(game.phaserGame);
				}
			}
		}, game);


		return game;
	},
	preload: function () {

		let screenDims = Utils.ScreenUtils.calculateScreenMetrics(Features.originalGameWidth, Features.originalGameHeight, Utils.Orientation.LANDSCAPE);

		this.game.custom = {};
		this.game.custom.gridWidth = parseInt(Math.ceil(screenDims.windowWidth / Features.gridXSections), 10);
		this.game.custom.gridHeight = parseInt(Math.ceil(screenDims.windowHeight / Features.gridYSections), 10);
		this.game.custom.scaleX = screenDims.scaleX;
		this.game.custom.scaleY = screenDims.scaleY;

	},
	create: function () {

		this.game.plugins.add(PhaserInput.Plugin);

		this.game.physics.startSystem(Phaser.Physics.ARCADE);

		this.game.state.add('preload', Preload.initialize(), false);
		this.game.state.add('load', Load.initialize(), false);
		this.game.state.add('menu', Menu.initialize(), false);
		this.game.state.add('credits', Credits.initialize(), false);
		this.game.state.add('play', Play.initialize(), false);
		this.game.state.start('preload');
	},

	setupAdMob: function (game) {
		let admobSettings = {};

		if(game.device.android) {
			admobSettings = {
				banner:'ca-app-pub-8061380484378750~9452175826',
				interstitial:'ca-app-pub-8061380484378750/3405642220'
			};
		} else if(game.device.iOS) {
			admobSettings = {
				banner:'ca-app-pub-8061380484378750~9452175826',
				interstitial:'ca-app-pub-8061380484378750/7835841821'
			};
		} 

		admob.createBanner({
			adId:admobSettings.banner,
			autoShow:false,
			isTesting:false,
			overlap: false
		}); 

		admob.prepareInterstitial({
			adId:admobSettings.interstitial,
			autoShow:false,
			isTesting:false
		});
	}
};

export default Game;