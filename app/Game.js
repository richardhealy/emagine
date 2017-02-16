import Phaser from '<shims>/Phaser';
import Preload from './states/Preload';
import Load from './states/Load';
import Menu from './states/Menu';
import Play from './states/Play';

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
				if (typeof AdMod !== 'undefined' && AdMob) {
					self.setupAdMob(game.phaserGame);
				}
			}
		}, game);


		return game;
	},
	create: function () {

		this.game.plugins.add(PhaserInput.Plugin);

		this.game.physics.startSystem(Phaser.Physics.ARCADE);

		this.game.scale.aspectRatio = 0.5;
		
		this.game.state.add('preload', Preload.initialize(), false);
		this.game.state.add('load', Load.initialize(), false);
		this.game.state.add('menu', Menu.initialize(), false);
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

		admod.createBanner({
			adId:admobSettings.banner,
			autoShow:false,
			isTesting:true,
			overlap: false
		}); 

		admob.prepareInterstitial({
			adId:admobSettings.interstitial,
			autoShow:false,
			isTesting:true
		});
	}
};

export default Game;