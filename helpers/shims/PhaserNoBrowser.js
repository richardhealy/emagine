// Based off: https://gist.github.com/crisu83/5857c4a638e57308be4f

// this is an ingenius hack that allows us to run Phaser without a browser
// ... and yes, it took some time to figure out how to do this

import Canvas from 'canvas';
import jsdom from 'node-jsdom';

var	document = jsdom.jsdom(null),
	window = document.parentWindow,
	XMLHttpRequest = require("local-xmlhttprequest").XMLHttpRequest,
	Phaser;

// expose a few things to all the modules
global.document = document;
global.window = window;
global.Canvas = Canvas;
global.Image = Canvas.Image;
global.window.CanvasRenderingContext2D = 'foo'; // let Phaser think that we have a canvas
global.window.Element = undefined;
global.window.document = global.document;
global.window.PhaserGlobal = {
  hideBanner: true
};
global.navigator = global.window.navigator = { userAgent: 'Custom' }; // could be anything

// fake the xml http request object because Phaser.Loader uses it
global.XMLHttpRequest = XMLHttpRequest;

// load an expose PIXI in order to finally load Phaser
global.PIXI = require('./../../dist/pixi');
global.p2 = require('./../../dist/p2');
global.Phaser = Phaser = require('./../../dist/phaser');

require('./../../dist/phaser-arcade-slopes');

module.exports = Phaser;