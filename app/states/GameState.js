import Phaser from '<shims>/Phaser';
import Stage from '../objects/Stage';
import Character from '../objects/Character';
import Features from '../config/Features';

var GameState = {
	initialize: function () {
		
		let state;

		state = new Phaser.State();
		state.create = this.create;
		state.update = this.update;

		return state;
	},
	create: function (game) {

		let stage = null,
			rain = null;

		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

		game.stage.setBackgroundColor('#697e96');

		stage = Stage.create(game);
		rain = Stage.createRain(game);

		rain.start(false, 1600, 5, 0);

		// Set stage map to game map
		game.map = stage.map;
		// Set stage bgTiles to game bgTiles 
		game.bgTiles = stage.bgTiles;

		game.map.addTilesetImage('tiles32', 'ground_32x32');
		game.ground = game.map.createLayer('collision');
		game.ground.resizeWorld();
		game.slopes.convertTilemapLayer(game.ground, {
				2:  'FULL',
				3:  'HALF_BOTTOM_LEFT',
				4:  'HALF_BOTTOM_RIGHT',
				6:  'HALF_TOP_LEFT',
				5:  'HALF_TOP_RIGHT',
				15: 'QUARTER_BOTTOM_LEFT_LOW',
				16: 'QUARTER_BOTTOM_RIGHT_LOW',
				17: 'QUARTER_TOP_RIGHT_LOW',
				18: 'QUARTER_TOP_LEFT_LOW',
				19: 'QUARTER_BOTTOM_LEFT_HIGH',
				20: 'QUARTER_BOTTOM_RIGHT_HIGH',
				21: 'QUARTER_TOP_RIGHT_HIGH',
				22: 'QUARTER_TOP_LEFT_HIGH',
				23: 'QUARTER_LEFT_BOTTOM_HIGH',
				24: 'QUARTER_RIGHT_BOTTOM_HIGH',
				25: 'QUARTER_RIGHT_TOP_LOW',
				26: 'QUARTER_LEFT_TOP_LOW',
				27: 'QUARTER_LEFT_BOTTOM_LOW',
				28: 'QUARTER_RIGHT_BOTTOM_LOW',
				29: 'QUARTER_RIGHT_TOP_HIGH',
				30: 'QUARTER_LEFT_TOP_HIGH',
				31: 'HALF_BOTTOM',
				32: 'HALF_RIGHT',
				33: 'HALF_TOP',
				34: 'HALF_LEFT'
			});
		// Enable collision between tile indexes 2 and 34
		game.map.setCollisionBetween(2, 34, true, 'collision');

		// Set world gavity
		game.physics.arcade.gravity.y = 1000;

		// Create player
		game.player = Character.create(game);

		// Enable physics for the player
		game.physics.arcade.enable(game.player);
		game.slopes.enable(game.player);

		// This needs to happen after it is enabled 
		// on slopes and physics engine.
		game.player = Character.setup(game.player, Features);

		// Position the player
		game.player.position.set(140, 400);

		// Map some keys for use in our update() loop
		game.controls = game.input.keyboard.addKeys({
			'up': Phaser.KeyCode.W,
			'down': Phaser.KeyCode.S,
			'left': Phaser.KeyCode.A,
			'right': Phaser.KeyCode.D,
			'follow': Phaser.KeyCode.F
		});

		// Register a pointer input event handler that teleports the player
		game.input.onDown.add(function (pointer) {
			game.player.position.x = pointer.worldX - game.player.width / 2;
			game.player.position.y = pointer.worldY - game.player.height / 2;
			
			// Reset the player's velocity
			game.player.body.velocity.set(0);
		});
		
		// Follow the player with the camera
		game.camera.follow(game.player);
	},
	update: function (game) {

		// Define some shortcuts to some useful objects
		var body = game.player.body;
		var gravity = game.physics.arcade.gravity;
		var blocked = body.blocked;
		var touching = body.touching;
		var controls = game.controls;

		// bgTiles Update
		game.bgTiles.mountainsBack.tilePosition.x -= 0.05;
    	game.bgTiles.mountainsMid1.tilePosition.x -= 0.3;
    	game.bgTiles.mountainsMid2.tilePosition.x -= 0.75;     

		// Update player body properties
		body.drag.x = Features.dragX;
		body.drag.y = Features.dragY;
		body.bounce.x = Features.bounceX;
		body.bounce.y = Features.bounceY;
		
		// Update player body Arcade Slopes properties
		body.slopes.friction.x = Features.frictionX;
		body.slopes.friction.y = Features.frictionY;
		body.slopes.preferY    = Features.minimumOffsetY;
		body.slopes.pullUp     = Features.pullUp;
		body.slopes.pullDown   = Features.pullDown;
		body.slopes.pullLeft   = Features.pullLeft;
		body.slopes.pullRight  = Features.pullRight;
		body.slopes.snapUp     = Features.snapUp;
		body.slopes.snapDown   = Features.snapDown;
		body.slopes.snapLeft   = Features.snapLeft;
		body.slopes.snapRight  = Features.snapRight;	
		
		// Collide the player against the collision layer
		game.physics.arcade.collide(game.player, game.ground);

		// Reset the player acceleration
		body.acceleration.x = 0;
		body.acceleration.y = 0;

		// Accelerate left
		if (controls.left.isDown) {
			body.acceleration.x = -Features.acceleration;
		}
		
		// Accelerate right
		if (controls.right.isDown) {
			body.acceleration.x = Features.acceleration;
		}
		
		// Accelerate or jump up
		if (controls.up.isDown) {
			if (Features.jump) {
				if (gravity.y > 0 && (blocked.down || touching.down)) {
					body.velocity.y = -Features.jump;
				}
			}
			
			if (!Features.jump || gravity.y <= 0){
				body.acceleration.y = -Math.abs(gravity.y) - Features.acceleration;
			}
		}
		
		// Accelerate down or jump down
		if (controls.down.isDown) {
			if (Features.jump) {
				if (gravity.y < 0 && (blocked.up || touching.up)) {
					body.velocity.y = Features.jump;
				}
			}
			
			if (!Features.jump || gravity.y >= 0){
				body.acceleration.y = Math.abs(gravity.y) + Features.acceleration;
			}
		}
		
		// Wall jump
		if (Features.wallJump && (controls.up.isDown && gravity.y > 0) || (controls.down.isDown && gravity.y < 0)) {
			if (!(blocked.down || blocked.up || touching.up)) {
				// Would be even better to use collision normals here
				if (blocked.left || touching.left) {
					body.velocity.x = Features.wallJump;
					body.velocity.y = gravity.y < 0 ? Features.jump : -Features.jump;
				}
				
				if (blocked.right || touching.right) {
					body.velocity.x = -Features.wallJump;
					body.velocity.y = gravity.y < 0 ? Features.jump : -Features.jump;
				}
			}
		}
	}
};

export default GameState;