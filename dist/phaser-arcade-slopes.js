/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
 * @license MIT
 */

/**
 * Arcade Slopes provides sloped tile functionality for tilemaps that use
 * Phaser's Arcade physics engine.
 * 
 * @class Phaser.Plugin.ArcadeSlopes
 * @constructor
 * @extends Phaser.Plugin
 * @param {Phaser.Game} game          - A reference to the game using this plugin.
 * @param {any}         parent        - The object that owns this plugin, usually a Phaser.PluginManager.
 * @param {integer}     defaultSolver - The default collision solver type to use for sloped tiles.
 */
Phaser.Plugin.ArcadeSlopes = function (game, parent, defaultSolver) {
	Phaser.Plugin.call(this, game, parent);
	
	/**
	 * The collision solvers provided by the plugin.
	 * 
	 * Maps solver constants to their respective instances.
	 * 
	 * @type {object}
	 */
	var solvers = {};
	
	solvers[Phaser.Plugin.ArcadeSlopes.SAT] = new Phaser.Plugin.ArcadeSlopes.SatSolver();
	
	/**
	 * The Arcade Slopes facade.
	 *
	 * @property {Phaser.Plugin.ArcadeSlopes.Facade} facade
	 */
	this.facade = new Phaser.Plugin.ArcadeSlopes.Facade(
		new Phaser.Plugin.ArcadeSlopes.TileSlopeFactory(),
		solvers,
		defaultSolver || Phaser.Plugin.ArcadeSlopes.SAT
	);
};

Phaser.Plugin.ArcadeSlopes.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.ArcadeSlopes.prototype.constructor = Phaser.Plugin.ArcadeSlopes;

/**
 * The Arcade Slopes plugin version number.
 * 
 * @constant
 * @type {string}
 */
Phaser.Plugin.ArcadeSlopes.VERSION = '0.2.0-dev';

/**
 * The Separating Axis Theorem collision solver type.
 * 
 * Uses the excellent SAT.js library.
 * 
 * @constant
 * @type {string}
 */
Phaser.Plugin.ArcadeSlopes.SAT = 'sat';

/**
 * The Metroid collision solver type.
 * 
 * Inspired by and adapted from the source of a Metroid clone by Jan Geselle.
 * 
 * @constant
 * @type {string}
 */
Phaser.Plugin.ArcadeSlopes.METROID = 'metroid';

/**
 * Initializes the plugin.
 * 
 * @method Phaser.Plugin.ArcadeSlopes#init
 */
Phaser.Plugin.ArcadeSlopes.prototype.init = function () {
	// Give the game an Arcade Slopes facade
	this.game.slopes = this.game.slopes || this.facade;
	
	// Keep a reference to the original collideSpriteVsTilemapLayer method
	this.originalCollideSpriteVsTilemapLayer = Phaser.Physics.Arcade.prototype.collideSpriteVsTilemapLayer;
	
	// Replace the original method with the Arcade Slopes override, along with
	// some extra methods that break down the functionality a little more
	Phaser.Physics.Arcade.prototype.collideSpriteVsTile = Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTile;
	Phaser.Physics.Arcade.prototype.collideSpriteVsTiles = Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTiles;
	Phaser.Physics.Arcade.prototype.collideSpriteVsTilemapLayer = Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTilemapLayer;
	
	// Add some extra neighbour methods to the Tilemap class
	Phaser.Tilemap.prototype.getTileTopLeft = Phaser.Plugin.ArcadeSlopes.Overrides.getTileTopLeft;
	Phaser.Tilemap.prototype.getTileTopRight = Phaser.Plugin.ArcadeSlopes.Overrides.getTileTopRight;
	Phaser.Tilemap.prototype.getTileBottomLeft = Phaser.Plugin.ArcadeSlopes.Overrides.getTileBottomLeft;
	Phaser.Tilemap.prototype.getTileBottomRight = Phaser.Plugin.ArcadeSlopes.Overrides.getTileBottomRight;
};

/**
 * Destroys the plugin and nulls its references. Restores any overriden methods.
 * 
 * @method Phaser.Plugin.ArcadeSlopes#destroy
 */
Phaser.Plugin.ArcadeSlopes.prototype.destroy = function () {
	// Null the game's reference to the facade
	this.game.slopes = null;
	
	// Restore the original collideSpriteVsTilemapLayer method and null the rest
	Phaser.Physics.Arcade.prototype.collideSpriteVsTile = null;
	Phaser.Physics.Arcade.prototype.collideSpriteVsTiles = null;
	Phaser.Physics.Arcade.prototype.collideSpriteVsTilemapLayer = this.originalCollideSpriteVsTilemapLayer;
	
	// Remove the extra neighbour methods from the Tilemap class
	Phaser.Tilemap.prototype.getTileTopLeft = null;
	Phaser.Tilemap.prototype.getTileTopRight = null;
	Phaser.Tilemap.prototype.getTileBottomLeft = null;
	Phaser.Tilemap.prototype.getTileBottomRight = null;
	
	// Call the parent destroy method
	Phaser.Plugin.prototype.destroy.call(this);
};

/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
 * @license MIT
 */

/**
 * A facade class to attach to a Phaser game.
 *
 * TODO: Extract a CollisionHandler/CollisionResolver class that stores solvers
 *       and defaultSolver that the facade can just forward calls to.
 * 
 * @class Phaser.Plugin.ArcadeSlopes.Facade
 * @constructor
 * @param {Phaser.Plugin.ArcadeSlopes.TileSlopeFactory} factory       - A tile slope factory.
 * @param {object}                                      solvers       - A set of collision solvers.
 * @param {integer}                                     defaultSolver - The default collision solver type to use for sloped tiles.
 */
Phaser.Plugin.ArcadeSlopes.Facade = function (factory, solvers, defaultSolver) {
	/**
	 * A tile slope factory.
	 * 
	 * @property {Phaser.Plugin.ArcadeSlopes.TileSlopeFactory} factory
	 */
	this.factory = factory;
	
	/**
	 * A set of collision solvers.
	 * 
	 * Maps solver constants to their respective instances.
	 * 
	 * @property {object} solvers
	 */
	this.solvers = solvers;
	
	/**
	 * The default collision solver type to use for sloped tiles.
	 * 
	 * @property {string} defaultSolver
	 * @default
	 */
	this.defaultSolver = defaultSolver || Phaser.Plugin.ArcadeSlopes.SAT;
};

/**
 * Enable the physics body of the given object for sloped tile interaction.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Facade#enable
 * @param {Phaser.Sprite|Phaser.Group} object - The object to enable sloped tile physics for.
 */
Phaser.Plugin.ArcadeSlopes.Facade.prototype.enable = function (object) {
	if (Array.isArray(object)) {
		for (var i = 0; i < object.length; i++) {
			this.enable(object[i]);
		}
	} else {
		if (object instanceof Phaser.Group) {
			this.enable(object.children);
		} else {
			if (object.hasOwnProperty('body')) {
				this.enableBody(object.body);
			}
			
			if (object.hasOwnProperty('children') && object.children.length > 0) {
				this.enable(object.children);
			}
		}
	}
};

/**
 * Enable the given physics body for sloped tile interaction.
 * 
 * TODO: Circle body support, when it's released.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Facade#enableBody
 * @param {Phaser.Physics.Arcade.Body} body - The physics body to enable.
 */
Phaser.Plugin.ArcadeSlopes.Facade.prototype.enableBody = function (body) {
	// Create an SAT polygon from the body's bounding box
	// TODO: Rename body.polygon to body.shape or body.slopes.shape
	if  (body.isCircle) {
		body.polygon = new SAT.Circle(
			new SAT.Vector(
				body.x + body.halfWidth,
				body.y + body.halfHeight
			),
			body.radius
		);
	} else {
		body.polygon = new SAT.Box(
			new SAT.Vector(body.x, body.y),
			body.width,
			body.height
		).toPolygon();
	}
	
	// Attach a new set of properties that configure the body's interaction
	// with sloped tiles (TODO: Formalize as a class?)
	body.slopes = Phaser.Utils.mixin(body.slopes || {}, {
		debug: false,
		friction: new Phaser.Point(),
		preferY: false,
		pullUp: 0,
		pullDown: 0,
		pullLeft: 0,
		pullRight: 0,
		pullTopLeft: 0,
		pullTopRight: 0,
		pullBottomLeft: 0,
		pullBottomRight: 0,
		sat: {
			response: null,
		},
		skipFriction: false,
		snapUp: 0,
		snapDown: 0,
		snapLeft: 0,
		snapRight: 0,
		velocity: new SAT.Vector()
	});
};

/**
 * Converts a layer of the given tilemap.
 * 
 * Attaches Phaser.Plugin.ArcadeSlopes.TileSlope objects that are used to define
 * how the tile should collide with a physics body.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Facade#convertTilemap
 * @param  {Phaser.Tilemap}                    map      - The map containing the layer to convert.
 * @param  {number|string|Phaser.TileMapLayer} layer    - The layer of the map to convert.
 * @param  {string|object}                     slopeMap - A mapping type string, or a map of tilemap indexes to ArcadeSlope.TileSlope constants.
 * @param  {integer}                           index    - An optional first tile index (firstgid).
 * @return {Phaser.Tilemap}                             - The converted tilemap.
 */
Phaser.Plugin.ArcadeSlopes.Facade.prototype.convertTilemap = function (map, layer, slopeMap, index) {
	return this.factory.convertTilemap(map, layer, slopeMap, index);
};

/**
 * Converts a tilemap layer.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Facade#convertTilemapLayer
 * @param  {Phaser.TilemapLayer}  layer    - The tilemap layer to convert.
 * @param  {string|object}        slopeMap - A mapping type string, or a map of tilemap indexes to ArcadeSlope.TileSlope constants.
 * @param  {integer}              index    - An optional first tile index (firstgid).
 * @return {Phaser.TilemapLayer}           - The converted tilemap layer.
 */
Phaser.Plugin.ArcadeSlopes.Facade.prototype.convertTilemapLayer = function (layer, slopeMap, index) {
	return this.factory.convertTilemapLayer(layer, slopeMap, index);
};

/**
 * Collides a physics body against a tile.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Facade#collide
 * @param  {integer}                    i           - The tile index.
 * @param  {Phaser.Physics.Arcade.Body} body        - The physics body.
 * @param  {Phaser.Tile}                tile        - The tile.
 * @param  {boolean}                    overlapOnly - Whether to only check for an overlap.
 * @return {boolean}                                - Whether the body was separated.
 */
Phaser.Plugin.ArcadeSlopes.Facade.prototype.collide = function (i, body, tile, overlapOnly) {
	if (tile.slope.solver && this.solvers.hasOwnProperty(tile.slope.solver)) {
		return this.solvers[tile.slope.solver].collide(i, body, tile, overlapOnly);
	}
	
	return this.solvers[this.defaultSolver].collide(i, body, tile, overlapOnly);
};

/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
 * @license MIT
 */

/**
 * A static class with override methods for Phaser's tilemap collisions and tile
 * neighbour checks.
 * 
 * @static
 * @class Phaser.Plugin.ArcadeSlopes.Override
 */
Phaser.Plugin.ArcadeSlopes.Overrides = {};

/**
 * Collide a sprite against a single tile.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#collideSpriteVsTile
 * @param  {integer}             i                - The tile index.
 * @param  {Phaser.Sprite}       sprite           - The sprite to check.
 * @param  {Phaser.Tile}         tile             - The tile to check.
 * @param  {Phaser.TilemapLayer} tilemapLayer     - The tilemap layer the tile belongs to.
 * @param  {function}            collideCallback  - An optional collision callback.
 * @param  {function}            processCallback  - An optional overlap processing callback.
 * @param  {object}              callbackContext  - The context in which to run the callbacks.
 * @param  {boolean}             overlapOnly      - Whether to only check for an overlap.
 * @return {boolean}                              - Whether a collision occurred.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTile = function (i, sprite, tile, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) {
	if (!sprite.body) {
		return false;
	}
	
	if (tile.hasOwnProperty('slope')) {
		if (this.game.slopes.collide(i, sprite.body, tile, overlapOnly)) {
			this._total++;
			
			if (collideCallback) {
				collideCallback.call(callbackContext, sprite, tile);
			}
			
			return true;
		}
	} else if (this.separateTile(i, sprite.body, tile, tilemapLayer, overlapOnly)) {
		this._total++;
		
		if (collideCallback) {
			collideCallback.call(callbackContext, sprite, tile);
		}
		
		return true;
	}
	
	return false;
};

/**
 * Collide a sprite against a set of tiles.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#collideSpriteVsTiles
 * @param  {Phaser.Sprite}       sprite           - The sprite to check.
 * @param  {Phaser.Tile[]}       tiles            - The tiles to check.
 * @param  {Phaser.TilemapLayer} tilemapLayer     - The tilemap layer the tiles belong to.
 * @param  {function}            collideCallback  - An optional collision callback.
 * @param  {function}            processCallback  - An optional overlap processing callback.
 * @param  {object}              callbackContext  - The context in which to run the callbacks.
 * @param  {boolean}             overlapOnly      - Whether to only check for an overlap.
 * @return {boolean}                              - Whether a collision occurred.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTiles = function (sprite, tiles, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) {
	var collided = false;
	
	if (!sprite.body) {
		return collided;
	}
	
	for (var i = 0; i < tiles.length; i++) {
		if (processCallback) {
			if (processCallback.call(callbackContext, sprite, tiles[i])) {
				collided = this.collideSpriteVsTile(i, sprite, tiles[i], tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) || collided;
			}
		} else {
			collided = this.collideSpriteVsTile(i, sprite, tiles[i], tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) || collided;
		}
	}
	
	return collided;
};

/**
 * Collide a sprite against a tile map layer.
 * 
 * This is used to override Phaser.Physics.Arcade.collideSpriteVsTilemapLayer().
 * 
 * @override Phaser.Physics.Arcade#collideSpriteVsTilemapLayer
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#collideSpriteVsTilemapLayer
 * @param  {Phaser.Sprite}       sprite           - The sprite to check.
 * @param  {Phaser.TilemapLayer} tilemapLayer     - The tilemap layer to check.
 * @param  {function}            collideCallback  - An optional collision callback.
 * @param  {function}            processCallback  - An optional overlap processing callback.
 * @param  {object}              callbackContext  - The context in which to run the callbacks.
 * @param  {boolean}             overlapOnly      - Whether to only check for an overlap.
 * @return {boolean}                              - Whether a collision occurred.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.collideSpriteVsTilemapLayer = function (sprite, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly) {
	if (!sprite.body) {
		return false;
	}
	
	var tiles = tilemapLayer.getTiles(
		sprite.body.position.x - sprite.body.tilePadding.x,
		sprite.body.position.y - sprite.body.tilePadding.y,
		sprite.body.width      + sprite.body.tilePadding.x,
		sprite.body.height     + sprite.body.tilePadding.y,
		false,
		false
	);
	
	if (tiles.length === 0) {
		return false;
	}
	
	var collided = this.collideSpriteVsTiles(sprite, tiles, tilemapLayer, collideCallback, processCallback, callbackContext, overlapOnly);
	
	if (!collided && !overlapOnly) {
		// TODO: This call is too hacky and solver-specific
		this.game.slopes.solvers.sat.snap(sprite.body, tiles);
	}
	
	return collided;
};

/**
 * Gets the tile to the top left of the coordinates given.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getTileTopLeft
 * @param  {integer} layer - The index of the layer to read the tile from.
 * @param  {integer} x     - The X coordinate, in tiles, to get the tile from.
 * @param  {integer} y     - The Y coordinate, in tiles, to get the tile from.
 * @return {Phaser.Tile}   - The tile found.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getTileTopLeft = function(layer, x, y) {
	if (x > 0 && y > 0) {
		return this.layers[layer].data[y - 1][x - 1];
	}
	
	return null;
};

/**
 * Gets the tile to the top right of the coordinates given.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getTileTopRight
 * @param  {integer} layer - The index of the layer to read the tile from.
 * @param  {integer} x     - The X coordinate, in tiles, to get the tile from.
 * @param  {integer} y     - The Y coordinate, in tiles, to get the tile from.
 * @return {Phaser.Tile}   - The tile found.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getTileTopRight = function(layer, x, y) {
	if (x < this.layers[layer].width - 1 && y > 0) {
		return this.layers[layer].data[y - 1][x + 1];
	}
	
	return null;
};

/**
 * Gets the tile to the bottom left of the coordinates given.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getTileBottomLeft
 * @param  {integer} layer - The index of the layer to read the tile from.
 * @param  {integer} x     - The X coordinate, in tiles, to get the tile from.
 * @param  {integer} y     - The Y coordinate, in tiles, to get the tile from.
 * @return {Phaser.Tile}   - The tile found.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getTileBottomLeft = function(layer, x, y) {
	if (x > 0 && y < this.layers[layer].height - 1) {
		return this.layers[layer].data[y + 1][x - 1];
	}
	
	return null;
};

/**
 * Gets the tile to the bottom right of the coordinates given.
 *
 * @method Phaser.Plugin.ArcadeSlopes.Overrides#getTileBottomRight
 * @param  {integer} layer - The index of the layer to read the tile from.
 * @param  {integer} x     - The X coordinate, in tiles, to get the tile from.
 * @param  {integer} y     - The Y coordinate, in tiles, to get the tile from.
 * @return {Phaser.Tile}   - The tile found.
 */
Phaser.Plugin.ArcadeSlopes.Overrides.getTileBottomRight = function(layer, x, y) {
	if (x < this.layers[layer].width - 1 && y < this.layers[layer].height - 1) {
		return this.layers[layer].data[y + 1][x + 1];
	}
	
	return null;
};

/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
 * @license MIT
 */

/**
 * Restrains SAT tile collision handling based on their neighbouring tiles.
 *
 * Can separate on a tile's preferred axis if it has one.
 *
 * This is what keeps the sloped tile collisions smooth for AABBs.
 * 
 * Think of it as the equivalent of the Arcade Physics tile face checks for all
 * of the sloped tiles and their possible neighbour combinations.
 *
 * Thanks to some painstaking heuristics, it allows a set of touching tiles to
 * behave more like a single shape.
 * 
 * TODO: Change all of these rules to work with the built in edge restraints.
 *       Will require checking all of these rules during tilemap convert.
 *       TileSlope specific edge flags would need to be set for this.
 *       See SatSolver.shouldSeparate(). That should deal with it.
 *       This would work because we're only trying to prevent
 *       axis-aligned overlap vectors, not anything else.
 *
 * TODO: Move away from these heuristics and start flagging edge visibility
 *       automatically, if that could at all work out as well as this has.
 *       Imagine using the normals of each face to prevent separation on
 *       that axis, and instead using the next shortest axis to collide.
 *       TL;DR: Disable separation on the normals of internal faces
 *       by flagging them and further customising SAT.js.
 * 
 * @class Phaser.Plugin.ArcadeSlopes.SatRestrainer
 * @constructor
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer = function () {
	/**
	 * Restraint definitions for SAT collision handling.
	 *
	 * Each restraint is an array of rules, keyed by a corresponding tile type.
	 *
	 * Each rule defines a neighbour to check, overlap ranges to match and
	 * optionally neighbouring tile slope types to match (the same type is used
	 * otherwise). The separate property determines whether to attempt to
	 * collide on the tile's preferred axis, if there is one.
	 * 
	 * Schema:
	 *   [
	 *     {
	 *       neighbour: 'above'|'below'|'left'|'right'|'topLeft'|'topRight'|'bottomLeft'|'bottomRight'
	 *       overlapX:  {integer}|[{integer}, {integer}]
	 *       overlapY:  {integer}|[{integer}, {integer}]
	 *       types:     {array of neighbour TileSlope type constants}
	 *       separate:  {boolean|function(body, tile, response)}
	 *    },
	 *    {
	 *      ...
	 *    }
	 *  ]
	 *
	 * Shorthand schema:
	 *   [
	 *     {
	 *       neighbour: 'above'|'below'|'left'|'right'|'topLeft'|'topRight'|'bottomLeft'|'bottomRight'
	 *       direction: 'up'|'down'|'left'|'right'
	 *       types:     {array of neighbour TileSlope type constants}
	 *       separate:  {boolean=true|function(body, tile, response)}
	 *     },
	 *     {
	 *       ...
	 *     }
	 *   ]
	 *
	 * @property {object} restraints
	 */
	this.restraints = {};
	
	// Define all of the default restraints
	this.setDefaultRestraints();
};

/**
 * Restrain the given SAT body-tile collision context based on the set rules.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatRestrainer#restrain
 * @param  {Phaser.Plugin.ArcadeSlopes.SatSolver} solver   - The SAT solver.
 * @param  {Phaser.Physics.Arcade.Body}           body     - The physics body.
 * @param  {Phaser.Tile}                          tile     - The tile.
 * @param  {SAT.Response}                         response - The initial collision response.
 * @return {boolean}                                       - Whether to continue collision handling.
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.prototype.restrain = function (solver, body, tile, response) {
	// Bail out if there's no overlap, no neighbours, or no tile type restraint
	if (!response.overlap || !tile.neighbours || !this.restraints.hasOwnProperty(tile.slope.type)) {
		return true;
	}

	for (var r in this.restraints[tile.slope.type]) {
		var rule = this.restraints[tile.slope.type][r];
		
		var neighbour = tile.neighbours[rule.neighbour];
		
		if (!(neighbour && neighbour.slope)) {
			continue;
		}
		
		// Restrain based on the same tile type by default
		var condition = false;
		
		if (rule.types) {
			condition = rule.types.indexOf(neighbour.slope.type) > -1;
		} else {
			condition = neighbour.slope.type === tile.slope.type;
		}
		
		// Restrain based on the overlapN.x value
		if (rule.hasOwnProperty('overlapX')) {
			if (typeof rule.overlapX === 'number') {
				condition = condition && response.overlapN.x === rule.overlapX;
			} else {
				condition = condition && response.overlapN.x >= rule.overlapX[0] && response.overlapN.x <= rule.overlapX[1];
			}
		}
		
		// Restrain based on the overlapN.y value
		if (rule.hasOwnProperty('overlapY')) {
			if (typeof rule.overlapY === 'number') {
				condition = condition && response.overlapN.y === rule.overlapY;
			} else {
				condition = condition && response.overlapN.y >= rule.overlapY[0] && response.overlapN.y <= rule.overlapY[1];
			}
		}
		
		// Return false if the restraint condition has been matched
		if (condition) {
			var separate = rule.separate;
			
			// Resolve the restraint separation decision if it's a function
			if (typeof separate === 'function') {
				separate = separate.call(this, body, tile, response);
			}
			
			// Collide on the tile's preferred axis if desired and available
			if (separate && tile.slope.axis) {
				solver.collideOnAxis(body, tile, tile.slope.axis);
			}
			
			return false;
		}
	}
	
	return true;
};

/**
 * Resolve overlapX and overlapY restraints from the given direction string.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatRestrainer#resolveOverlaps
 * @param  {string} direction
 * @return {object}
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.resolveOverlaps = function (direction) {
	switch (direction) {
		case 'up':
			return {
				overlapX: 0,
				overlapY: [-1, 0]
			};
		case 'down':
			return {
				overlapX: 0,
				overlapY: [0, 1]
			};
		case 'left':
			return {
				overlapX: [-1, 0],
				overlapY: 0
			};
		case 'right':
			return {
				overlapX: [0, 1],
				overlapY: 0
			};
	}
	
	console.warn('Unknown overlap direction \'' + direction + '\'');
	
	return {};
};

/**
 * Formalizes the given informally defined restraints.
 *
 * Converts direction properties into overlapX and overlapY properties and
 * tile type strings into tile type constants.
 *
 * This simply allows for more convenient constraint definitions.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatRestrainer#createRestraints
 * @param  {object}        restraints - The restraints to prepare.
 * @return {object}                   - The prepared restraints.
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.prepareRestraints = function(restraints) {
	var prepared = {};
	
	for (var type in restraints) {
		var restraint = restraints[type];
		
		// Resolve each rule in the restraint
		for (var r in restraint) {
			var rule = restraint[r];
			
			// Resolve overlapX and overlapY restraints from a direction
			if (rule.direction) {
				var resolved = Phaser.Plugin.ArcadeSlopes.SatRestrainer.resolveOverlaps(rule.direction);
				
				rule.overlapX = resolved.overlapX;
				rule.overlapY = resolved.overlapY;
			}
			
			// Resolve neighbour types from their string representations
			for (var nt in rule.types) {
				rule.types[nt] = Phaser.Plugin.ArcadeSlopes.TileSlope.resolveType(rule.types[nt]);
			}
			
			// Conveniently set separate to true unless it's already false
			if (rule.separate !== false && typeof rule.separate !== 'function') {
				rule.separate = true;
			}
		}
		
		var restraintType = Phaser.Plugin.ArcadeSlopes.TileSlope.resolveType(type);
		
		prepared[restraintType] = restraint;
	}
	
	return prepared;
};

/**
 * Set all of the default SAT collision handling restraints.
 *
 * These are the informally defined hueristics that get refined and utilised
 * above.
 *
 * They were cumbersome to write but they definitely pay off.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatRestrainer#setDefaultRestraints
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.prototype.setDefaultRestraints = function () {
	var restraints = {};
	
	restraints.HALF_TOP = [
		{
			direction: 'left',
			neighbour: 'left',
			types: this.resolve('topRight', 'right'),
			separate: false
		},
		{
			direction: 'right',
			neighbour: 'right',
			types: this.resolve('topLeft', 'left'),
			separate: false
		}
	];

	restraints.HALF_BOTTOM = [
		{
			direction: 'left',
			neighbour: 'left',
			types: this.resolve('right', 'bottomRight'),
			separate: false
		},
		{
			direction: 'right',
			neighbour: 'right',
			types: this.resolve('left', 'bottomLeft'),
			separate: false
		}
	];

	restraints.HALF_LEFT = [
		{
			direction: 'up',
			neighbour: 'above',
			types: this.resolve('bottomLeft', 'bottom'),
			separate: false
		},
		{
			direction: 'down',
			neighbour: 'below',
			types: this.resolve('topLeft', 'top'),
			separate: false
		}
	];

	restraints.HALF_RIGHT = [
		{
			direction: 'up',
			neighbour: 'above',
			types: this.resolve('bottom', 'bottomRight'),
			separate: false
		},
		{
			direction: 'down',
			neighbour: 'below',
			types: this.resolve('top', 'topRight'),
			separate: false
		}
	];

	restraints.HALF_BOTTOM_LEFT = [
		{
			direction: 'right',
			neighbour: 'bottomRight',
			types: this.resolve('topLeft')
		},
		{
			direction: 'up',
			neighbour: 'topLeft',
			types: this.resolve('bottomRight')
		}
	];

	restraints.HALF_BOTTOM_RIGHT = [
		{
			direction: 'left',
			neighbour: 'bottomLeft',
			types: this.resolve('topRight'),
		},
		{
			direction: 'up',
			neighbour: 'topRight',
			types: this.resolve('bottomLeft')
		}
	];

	restraints.HALF_TOP_LEFT = [
		{
			direction: 'right',
			neighbour: 'topRight',
			types: this.resolve('bottomLeft')
		},
		{
			direction: 'down',
			neighbour: 'bottomLeft',
			types: this.resolve('topRight')
		}
	];

	restraints.HALF_TOP_RIGHT = [
		{
			direction: 'left',
			neighbour: 'topLeft',
			types: this.resolve('bottomRight')
		},
		{
			direction: 'down',
			neighbour: 'bottomRight',
			types: this.resolve('topLeft')
		}
	];

	restraints.QUARTER_BOTTOM_LEFT_LOW = [
		{
			direction: 'right',
			neighbour: 'bottomRight',
			types: this.resolve('topLeft')
		},
		{
			direction: 'up',
			neighbour: 'left',
			types: this.resolve('topLeft', 'right', 'bottomRight')
		},
		{
			direction: 'left',
			neighbour: 'left',
			types: this.resolve('right', 'bottomRight'),
			separate: false
		}
	];

	restraints.QUARTER_BOTTOM_LEFT_HIGH = [
		{
			direction: 'right',
			neighbour: 'right',
			types: this.resolve('left', 'bottomLeft'),
			separate: function (body, tile) {
				return body.bottom < tile.bottom;
			}
		},
		{
			direction: 'up',
			neighbour: 'topLeft',
			types: this.resolve('bottomRight')
		}
	];

	restraints.QUARTER_BOTTOM_RIGHT_LOW = [
		{
			direction: 'left',
			neighbour: 'bottomLeft',
			types: this.resolve('topRight')
		},
		{
			direction: 'up',
			neighbour: 'right',
			types: this.resolve('topRight', 'left', 'bottomLeft')
		},
		{
			direction: 'right',
			neighbour: 'right',
			types: this.resolve('left', 'bottomLeft'),
			separate: false
		}
	];

	restraints.QUARTER_BOTTOM_RIGHT_HIGH = [
		{
			direction: 'left',
			neighbour: 'left',
			types: this.resolve('right', 'bottomRight'),
			separate: function (body, tile) {
				return body.bottom < tile.bottom;
			}
		},
		{
			direction: 'up',
			neighbour: 'topRight',
			types: this.resolve('bottomLeft')
		}
	];
	
	restraints.QUARTER_LEFT_BOTTOM_LOW = [
		{
			direction: 'up',
			neighbour: 'above',
			types: this.resolve('topLeft', 'left'),
			separate: function (body, tile) {
				return body.left > tile.left;
			}
		},
		{
			direction: 'right',
			neighbour: 'bottomRight',
			types: this.resolve('topLeft')
		}
	];
	
	restraints.QUARTER_LEFT_BOTTOM_HIGH = [
		{
			direction: 'up',
			neighbour: 'topLeft',
			types: this.resolve('bottomRight')
		},
		{
			direction: 'down',
			neighbour: 'below',
			types: this.resolve('topLeft', 'top'),
			separate: false
		},
		{
			direction: 'right',
			neighbour: 'below',
			types: this.resolve('topLeft', 'top', 'bottomRight')
		}
	];
	
	restraints.QUARTER_RIGHT_BOTTOM_LOW = [
		{
			direction: 'up',
			neighbour: 'above',
			types: this.resolve('bottom', 'bottomRight'),
			separate: function (body, tile) {
				return body.right < tile.right;
			}
		},
		{
			direction: 'left',
			neighbour: 'bottomLeft',
			types: this.resolve('topRight')
		}
	];
	
	restraints.QUARTER_RIGHT_BOTTOM_HIGH = [
		{
			direction: 'up',
			neighbour: 'topRight',
			types: this.resolve('bottomLeft')
		},
		{
			direction: 'down',
			neighbour: 'below',
			types: this.resolve('top', 'topRight'),
			separate: false
		},
		{
			direction: 'left',
			neighbour: 'below',
			types: this.resolve('top', 'topRight', 'bottomLeft')
		}
	];
	
	restraints.QUARTER_LEFT_TOP_LOW = [
		{
			direction: 'up',
			neighbour: 'above',
			types: this.resolve('bottomLeft', 'bottom')
		},
		{
			direction: 'right',
			neighbour: 'above',
			types: this.resolve('bottomLeft', 'bottom'),
			separate: false
		},
		{
			direction: 'down',
			neighbour: 'bottomLeft',
			types: this.resolve('topRight')
		}
	];
	
	restraints.QUARTER_LEFT_TOP_HIGH = [
		{
			direction: 'right',
			neighbour: 'topRight',
			types: this.resolve('bottomLeft')
		},
		{
			direction: 'down',
			neighbour: 'below',
			types: this.resolve('topLeft', 'top'),
			separate: function (body, tile) {
				return body.left > tile.left;
			}
		}
	];
	
	restraints.QUARTER_RIGHT_TOP_LOW = [
		{
			direction: 'up',
			neighbour: 'above',
			types: this.resolve('bottom', 'bottomRight')
		},
		{
			direction: 'left',
			neighbour: 'above',
			types: this.resolve('bottom', 'bottomRight'),
			separate: false
		},
		{
			direction: 'down',
			neighbour: 'bottomRight',
			types: this.resolve('topLeft')
		}
	];
	
	restraints.QUARTER_RIGHT_TOP_HIGH = [
		{
			direction: 'left',
			neighbour: 'topLeft',
			types: this.resolve('bottomRight')
		},
		{
			direction: 'down',
			neighbour: 'below',
			types: this.resolve('top', 'topRight'),
			separate: function (body, tile) {
				return body.right < tile.right;
			}
		}
	];
	
	restraints.QUARTER_TOP_LEFT_LOW = [
		{
			direction: 'right',
			neighbour: 'topRight',
			types: this.resolve('bottomLeft')
		},
		{
			direction: 'left',
			neighbour: 'left',
			types: this.resolve('topRight', 'right'),
			separate: false
		},
		{
			direction: 'down',
			neighbour: 'left',
			types: this.resolve('bottomLeft', 'topRight', 'right')
		}
	];
	
	restraints.QUARTER_TOP_LEFT_HIGH = [
		{
			direction: 'right',
			neighbour: 'right',
			types: this.resolve('topLeft', 'left'),
			separate: function (body, tile) {
				return body.top > tile.top;
			}
		},
		{
			direction: 'down',
			neighbour: 'bottomLeft',
			types: this.resolve('topRight')
		}
	];
	
	restraints.QUARTER_TOP_RIGHT_LOW = [
		{
			direction: 'left',
			neighbour: 'topLeft',
			types: this.resolve('bottomRight')
		},
		{
			direction: 'right',
			neighbour: 'right',
			types: this.resolve('topLeft', 'left'),
			separate: false
		},
		{
			direction: 'down',
			neighbour: 'right',
			types: this.resolve('bottomRight', 'topLeft', 'left')
		}
	];
	
	restraints.QUARTER_TOP_RIGHT_HIGH = [
		{
			direction: 'left',
			neighbour: 'left',
			types: this.resolve('topRight', 'right'),
			separate: function (body, tile) {
				return body.top > tile.top;
			}
		},
		{
			direction: 'down',
			neighbour: 'bottomRight',
			types: this.resolve('topLeft')
		}
	];
	
	// Keep a copy of the informal restraints for inspection
	this.informalRestraints = JSON.parse(JSON.stringify(restraints));
	
	this.restraints = Phaser.Plugin.ArcadeSlopes.SatRestrainer.prepareRestraints(restraints);
};

/**
 * Compute the intersection of two arrays.
 * 
 * Returns a unique set of values that exist in both arrays.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatRestrainer#intersectArrays
 * @param  {array} a - The first array.
 * @param  {array} b - The second array.
 * @return {array}   - The unique set of values shared by both arrays.
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.intersectArrays = function (a, b) {
	return a.filter(function (value) {
		return b.indexOf(value) !== -1;
	}).filter(function (value, index, array) {
		return array.indexOf(value) === index;
	});
};

/**
 * Resolve the types of all tiles with vertices in all of the given locations.
 *
 * Locations can be:
 *   'topLeft',    'top',       'topRight',
 *   'left',                       'right',
 *   'bottomLeft', 'bottom', 'bottomRight'
 * 
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#resolve
 * @param  {...string} locations - A set of AABB vertex locations as strings.
 * @return {array}               - The tile slope types with matching vertices.
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.prototype.resolve = function () {
	var types = [];
	
	if (!arguments.length) {
		return types;
	}
	
	// Check the vertex maps of the given locations
	for (var l in arguments) {
		var location = arguments[l];
		
		if (!Phaser.Plugin.ArcadeSlopes.SatRestrainer.hasOwnProperty(location + 'Vertices')) {
			console.warn('Tried to resolve types from undefined vertex map location \'' + location + '\'');
			continue;
		}
		
		var vertexMap = Array.prototype.slice.call(Phaser.Plugin.ArcadeSlopes.SatRestrainer[location + 'Vertices']);
		
		// If we only have one location to match, we can return its vertex map
		if (arguments.length === 1) {
			return vertexMap;
		}
		
		// If we don't have any types yet, use this vertex map to start with,
		// otherwise intersect this vertex map with the current types
		if (!types.length) {
			types = vertexMap;
		} else {
			types = Phaser.Plugin.ArcadeSlopes.SatRestrainer.intersectArrays(types, vertexMap);
		}
	}
	
	return types;
};

// TODO: Automate these definitions instead of relying on tedious heuristics.
//       Store them in a single vertexMaps property object, too.

/**
 * The set of tile slope types with a top center vertex.
 *
 * @static
 * @property {array} topVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.topVertices = [
	'HALF_LEFT',
	'HALF_RIGHT',
	'QUARTER_LEFT_TOP_LOW',
	'QUARTER_RIGHT_TOP_LOW',
	'QUARTER_LEFT_BOTTOM_LOW',
	'QUARTER_RIGHT_BOTTOM_LOW'
];

/**
 * The set of tile slope types with a bottom center vertex.
 *
 * @static
 * @property {array} bottomVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.bottomVertices = [
	'HALF_LEFT',
	'HALF_RIGHT',
	'QUARTER_LEFT_TOP_HIGH',
	'QUARTER_LEFT_BOTTOM_HIGH',
	'QUARTER_RIGHT_TOP_HIGH',
	'QUARTER_RIGHT_BOTTOM_HIGH'
];

/**
 * The set of tile slope types with a left center vertex.
 *
 * @static
 * @property {array} leftVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.leftVertices = [
	'HALF_TOP',
	'HALF_BOTTOM',
	'QUARTER_TOP_LEFT_LOW',
	'QUARTER_TOP_RIGHT_HIGH',
	'QUARTER_BOTTOM_LEFT_LOW',
	'QUARTER_BOTTOM_RIGHT_HIGH'
];

/**
 * The set of tile slope types with a right center vertex.
 *
 * @static
 * @property {array} rightVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.rightVertices = [
	'HALF_TOP',
	'HALF_BOTTOM',
	'QUARTER_TOP_LEFT_HIGH',
	'QUARTER_TOP_RIGHT_LOW',
	'QUARTER_BOTTOM_LEFT_HIGH',
	'QUARTER_BOTTOM_RIGHT_LOW',
];

/**
 * The set of tile slope types with a top left vertex.
 *
 * @static
 * @property {array} topLeftVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.topLeftVertices = [
	'FULL',
	'HALF_TOP',
	'HALF_LEFT',
	'HALF_TOP_LEFT',
	'HALF_TOP_RIGHT',
	'HALF_BOTTOM_LEFT',
	'QUARTER_TOP_LEFT_LOW',
	'QUARTER_TOP_LEFT_HIGH',
	'QUARTER_TOP_RIGHT_HIGH',
	'QUARTER_BOTTOM_LEFT_HIGH',
	'QUARTER_LEFT_TOP_LOW',
	'QUARTER_LEFT_TOP_HIGH',
	'QUARTER_LEFT_BOTTOM_LOW',
	'QUARTER_LEFT_BOTTOM_HIGH',
	'QUARTER_RIGHT_TOP_HIGH'
];

/**
 * The set of tile slope types with a top right vertex.
 *
 * @static
 * @property {array} topRightVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.topRightVertices = [
	'FULL',
	'HALF_TOP',
	'HALF_RIGHT',
	'HALF_TOP_LEFT',
	'HALF_TOP_RIGHT',
	'HALF_BOTTOM_RIGHT',
	'QUARTER_TOP_LEFT_LOW',
	'QUARTER_TOP_LEFT_HIGH',
	'QUARTER_TOP_RIGHT_LOW',
	'QUARTER_TOP_RIGHT_HIGH',
	'QUARTER_BOTTOM_RIGHT_HIGH',
	'QUARTER_LEFT_TOP_HIGH',
	'QUARTER_RIGHT_TOP_LOW',
	'QUARTER_RIGHT_TOP_HIGH',
	'QUARTER_RIGHT_BOTTOM_LOW',
	'QUARTER_RIGHT_BOTTOM_HIGH'
];

/**
 * The set of tile slope types with a bottom left vertex.
 *
 * @static
 * @property {array} bottomLeftVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.bottomLeftVertices = [
	'FULL',
	'HALF_LEFT',
	'HALF_BOTTOM',
	'HALF_TOP_LEFT',
	'HALF_BOTTOM_LEFT',
	'HALF_BOTTOM_RIGHT',
	'QUARTER_TOP_LEFT_HIGH',
	'QUARTER_BOTTOM_LEFT_LOW',
	'QUARTER_BOTTOM_LEFT_HIGH',
	'QUARTER_BOTTOM_RIGHT_LOW',
	'QUARTER_BOTTOM_RIGHT_HIGH',
	'QUARTER_LEFT_TOP_HIGH',
	'QUARTER_LEFT_BOTTOM_LOW',
	'QUARTER_LEFT_BOTTOM_HIGH',
	'QUARTER_RIGHT_BOTTOM_LOW'
];

/**
 * The set of tile slope types with a bottom right vertex.
 *
 * @static
 * @property {array} bottomRightVertices
 */
Phaser.Plugin.ArcadeSlopes.SatRestrainer.bottomRightVertices = [
	'FULL',
	'HALF_RIGHT',
	'HALF_BOTTOM',
	'HALF_TOP_RIGHT',
	'HALF_BOTTOM_LEFT',
	'HALF_BOTTOM_RIGHT',
	'QUARTER_TOP_RIGHT_HIGH',
	'QUARTER_BOTTOM_LEFT_LOW',
	'QUARTER_BOTTOM_LEFT_HIGH',
	'QUARTER_BOTTOM_RIGHT_LOW',
	'QUARTER_BOTTOM_RIGHT_HIGH',
	'QUARTER_LEFT_BOTTOM_LOW',
	'QUARTER_RIGHT_TOP_HIGH',
	'QUARTER_RIGHT_BOTTOM_LOW',
	'QUARTER_RIGHT_BOTTOM_HIGH'
];

/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
 * @license MIT
 */

/**
 * Solves tile collisions using the Separating Axis Theorem.
 * 
 * @class Phaser.Plugin.ArcadeSlopes.SatSolver
 * @constructor
 * @param {object} options - Options for the SAT solver.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver = function (options) {
	/**
	 * Options for the SAT solver.
	 * 
	 * @property {object} options
	 */
	this.options = Phaser.Utils.mixin(options || {}, {
		// Whether to store debug data with all encountered physics bodies
		debug: false,
		// Whether to prefer the minimum Y offset over the smallest separation
		preferY: false,
		// Whether to restrain SAT collisions
		restrain: true
	});
	
	/**
	 * Objects that have the chance to process collisions themselves.
	 *
	 * They should expose a restrain() function.
	 *
	 * @property {object[]} restrainters
	 */
	this.restrainers = [
		new Phaser.Plugin.ArcadeSlopes.SatRestrainer()
	];
};

/**
 * Prepare the given SAT response by inverting the overlap vectors.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#prepareResponse
 * @param  {SAT.Response}
 * @return {SAT.Response}
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prepareResponse = function(response) {
	// Invert our overlap vectors so that we have them facing outwards
	response.overlapV.scale(-1);
	response.overlapN.scale(-1);
	
	return response;
};

/**
 * Calculate the minimum X offset given an overlap vector.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#minimumOffsetX
 * @param  {SAT.Vector} vector - The overlap vector.
 * @return {integer}
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.minimumOffsetX = function (vector) {
	return ((vector.y * vector.y) / vector.x) + vector.x;
};

/**
 * Calculate the minimum Y offset given an overlap vector.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#minimumOffsetY
 * @param  {SAT.Vector} vector - The overlap vector.
 * @return {integer}
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.minimumOffsetY = function (vector) {
	return ((vector.x * vector.x) / vector.y) + vector.y;
};

/**
 * Determine whether the given body is moving against the overlap vector of the
 * given response on the Y axis.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#movingAgainstY
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {SAT.Response}               response - The SAT response.
 * @return {boolean}                             - Whether the body is moving against the overlap vector.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.movingAgainstY = function (body, response) {
	return (response.overlapV.y < 0 && body.velocity.y > 0) || (response.overlapV.y > 0 && body.velocity.y < 0);
};

// TODO: shouldPreferX()

/**
 * Determine whether a body should be separated on the Y axis only, given an SAT
 * response.
 *
 * Returns true if options.preferY is true, the overlap vector is non-zero
 * for each axis and the body is moving against the overlap vector.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#shouldPreferY
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {SAT.Response}               response - The SAT response.
 * @return {boolean}                             - Whether to separate on the Y axis only.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.shouldPreferY = function (body, response) {
	return (this.options.preferY || body.slopes.preferY) &&                  // Enabled globally or on the body
		response.overlapV.y !== 0 && response.overlapV.x !== 0 &&            // There's an overlap on both axes
		Phaser.Plugin.ArcadeSlopes.SatSolver.movingAgainstY(body, response); // And we're moving into the shape
};

/**
 * Determine whether two polygons intersect on a given axis.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#isSeparatingAxis
 * @param  {SAT.Polygon}  a        - The first polygon.
 * @param  {SAT.Polygon}  b        - The second polygon.
 * @param  {SAT.Vector}   axis     - The axis to test.
 * @param  {SAT.Response} response - The response to populate.
 * @return {boolean}               - Whether a separating axis was found.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.isSeparatingAxis = function (a, b, axis, response) {
	var result = SAT.isSeparatingAxis(a.pos, b.pos, a.points, b.points, axis, response || null);
	
	if (response) {
		response.a = a;
		response.b = b;
		response.overlapV = response.overlapN.clone().scale(response.overlap);
	}
	
	return result;
};

/**
 * Separate a body from a tile using the given SAT response.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#separate
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {Phaser.Tile}                tile     - The tile.
 * @param  {SAT.Response}               response - The SAT response.
 * @param  {boolean}                    force    - Whether to force separation.
 * @return {boolean}                             - Whether the body was separated.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.separate = function (body, tile, response, force) {
	// Test whether we need to separate from the tile by checking its edge
	// properties and any separation constraints
	if (!force && !this.shouldSeparate(tile.index, body, tile, response)) {
		return false;
	}
	
	// Run any custom tile callbacks, with local callbacks taking priority over
	// layer level callbacks
	if (tile.collisionCallback && !tile.collisionCallback.call(tile.collisionCallbackContext, body.sprite, tile)) {
		return false;
	} else if (tile.layer.callbacks[tile.index] && !tile.layer.callbacks[tile.index].callback.call(tile.layer.callbacks[tile.index].callbackContext, body.sprite, tile)) {
		return false;
	}
	
	// Separate the body from the tile
	if (this.shouldPreferY(body, response)) {
		body.position.y += Phaser.Plugin.ArcadeSlopes.SatSolver.minimumOffsetY(response.overlapV);
	} else {
		body.position.x += response.overlapV.x;
		body.position.y += response.overlapV.y;
	}
	
	return true;
};

/**
 * Apply velocity changes (friction and bounce) to a body given a tile and
 * SAT collision response.
 * 
 * TODO: Optimize by pooling bounce and friction vectors.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#applyVelocity
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {Phaser.Tile}                tile     - The tile.
 * @param  {SAT.Response}               response - The SAT response.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.applyVelocity = function (body, tile, response) {
	// Project our velocity onto the overlap normal for the bounce vector (Vn)
	var bounce = body.slopes.velocity.clone().projectN(response.overlapN);
	
	// Then work out the surface vector (Vt)
	var friction = body.slopes.velocity.clone().sub(bounce);
	
	// Apply bounce coefficients
	bounce.x = bounce.x * (-body.bounce.x);
	bounce.y = bounce.y * (-body.bounce.y);
	
	// Apply friction coefficients
	friction.x = friction.x * (1 - body.slopes.friction.x - tile.slope.friction.x);
	friction.y = friction.y * (1 - body.slopes.friction.y - tile.slope.friction.y);
	
	// Now we can get our new velocity by adding the bounce and friction vectors
	body.velocity.x = bounce.x + friction.x;
	body.velocity.y = bounce.y + friction.y;
	
	// Process collision pulling
	this.pull(body, response);
};

/**
 * Update the position and velocity values of the slopes body.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#updateValues
 * @param  {Phaser.Physics.Arcade.Body} body - The physics body.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.updateValues = function (body) {
	// Update the body polygon position
	body.polygon.pos.x = body.x;
	body.polygon.pos.y = body.y;
	
	// Update the body's velocity vector
	body.slopes.velocity.x = body.velocity.x;
	body.slopes.velocity.y = body.velocity.y;
};

/**
 * Update the flags of a physics body using a given SAT response.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#updateFlags
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {SAT.Response}               response - The SAT response.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.updateFlags = function (body, response) {
	// Set the wasTouching values
	body.wasTouching.up    = body.touching.up;
	body.wasTouching.down  = body.touching.down;
	body.wasTouching.left  = body.touching.left;
	body.wasTouching.right = body.touching.right;
	body.wasTouching.none  = body.touching.none;

	// Set the touching values
	body.touching.up    = body.touching.up    || response.overlapV.y > 0;
	body.touching.down  = body.touching.down  || response.overlapV.y < 0;
	body.touching.left  = body.touching.left  || response.overlapV.x > 0;
	body.touching.right = body.touching.right || response.overlapV.x < 0;
	body.touching.none  = !body.touching.up && !body.touching.down && !body.touching.left && !body.touching.right;
	
	// Set the blocked values
	body.blocked.up    = body.blocked.up    || response.overlapV.x === 0 && response.overlapV.y > 0;
	body.blocked.down  = body.blocked.down  || response.overlapV.x === 0 && response.overlapV.y < 0;
	body.blocked.left  = body.blocked.left  || response.overlapV.y === 0 && response.overlapV.x > 0;
	body.blocked.right = body.blocked.right || response.overlapV.y === 0 && response.overlapV.x < 0;
};

/**
 * Attempt to snap the body to a given set of tiles based on its slopes options.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#snap
 * @param  {Phaser.Physics.Arcade.Body} body  - The physics body.
 * @param  {Phaser.Tile[]}              tiles - The tiles.
 * @return {boolean}                          - Whether the body was snapped to any tiles.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.snap = function (body, tiles) {
	if (!body.slopes && !body.slopes.snapUp && !body.slopes.snapDown && !body.slopes.snapLeft && !body.slopes.snapRight) {
		return false;
	}
	
	// Keep the current body position to snap from
	var current = new Phaser.Point(body.position.x, body.position.y);
	
	// Keep track of whether the body has snapped to a tile
	var snapped = false;
	
	// For each tile, move the body in each direction by the configured amount,
	// and try to collide, returning the body to its original position if no
	// collision occurs
	for (var t in tiles) {
		var tile = tiles[t];
		
		if (!tile.slope) {
			continue;
		}
		
		if (body.slopes.snapUp) {
			body.position.x = current.x;
			body.position.y = current.y - body.slopes.snapUp;
			
			if (this.snapCollide(body, tile, current)) {
				return true;
			}
		}
		
		if (body.slopes.snapDown) {
			body.position.x = current.x;
			body.position.y = current.y + body.slopes.snapDown;
			
			if (this.snapCollide(body, tile, current)) {
				return true;
			}
		}
		
		if (body.slopes.snapLeft) {
			body.position.x = current.x - body.slopes.snapLeft;
			body.position.y = current.y;
			
			if (this.snapCollide(body, tile, current)) {
				return true;
			}
		}
		
		if (body.slopes.snapRight) {
			body.position.x = current.x + body.slopes.snapRight;
			body.position.y = current.y;
			
			if (this.snapCollide(body, tile, current)) {
				return true;
			}
		}
	}
	
	return false;
};

/**
 * Pull the body into a collision response based on its slopes options.
 *
 * TODO: Don't return after any condition is met, accumulate values into a
 *       single SAT.Vector and apply at the end.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#pull
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {SAT.Response}               response - The SAT response.
 * @return {boolean}                             - Whether the body was pulled.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.pull = function (body, response) {
	if (!body.slopes.pullUp && !body.slopes.pullDown && !body.slopes.pullLeft && !body.slopes.pullRight &&
		!body.slopes.pullTopLeft && !body.slopes.pullTopRight && !body.slopes.pullBottomLeft && !body.slopes.pullBottomRight) {
		return false;
	}
	
	// Clone and flip the overlap normal so that it faces into the collision
	var overlapN = response.overlapN.clone().scale(-1);
	
	if (body.slopes.pullUp && overlapN.y < 0) {
		// Scale it by the configured amount
		pullUp = overlapN.clone().scale(body.slopes.pullUp);
		
		// Apply it to the body velocity
		body.velocity.x += pullUp.x;
		body.velocity.y += pullUp.y;
		
		return true;
	}
	
	if (body.slopes.pullDown && overlapN.y > 0) {
		pullDown = overlapN.clone().scale(body.slopes.pullDown);
		
		body.velocity.x += pullDown.x;
		body.velocity.y += pullDown.y;
		
		return true;
	}
	
	if (body.slopes.pullLeft && overlapN.x < 0) {
		pullLeft = overlapN.clone().scale(body.slopes.pullLeft);
		
		body.velocity.x += pullLeft.x;
		body.velocity.y += pullLeft.y;
		
		return true;
	}
	
	if (body.slopes.pullRight && overlapN.x > 0) {
		pullRight = overlapN.clone().scale(body.slopes.pullRight);
		
		body.velocity.x += pullRight.x;
		body.velocity.y += pullRight.y;
		
		return true;
	}
	
	if (body.slopes.pullTopLeft && overlapN.x < 0 && overlapN.y < 0) {
		pullUp = overlapN.clone().scale(body.slopes.pullTopLeft);
		
		body.velocity.x += pullUp.x;
		body.velocity.y += pullUp.y;
		
		return true;
	}
	
	if (body.slopes.pullTopRight && overlapN.x > 0 && overlapN.y < 0) {
		pullDown = overlapN.clone().scale(body.slopes.pullTopRight);
		
		body.velocity.x += pullDown.x;
		body.velocity.y += pullDown.y;
		
		return true;
	}
	
	if (body.slopes.pullBottomLeft && overlapN.x < 0 && overlapN.y > 0) {
		pullLeft = overlapN.clone().scale(body.slopes.pullBottomLeft);
		
		body.velocity.x += pullLeft.x;
		body.velocity.y += pullLeft.y;
		
		return true;
	}
	
	if (body.slopes.pullBottomRight && overlapN.x > 0 && overlapN.y > 0) {
		pullRight = overlapN.clone().scale(body.slopes.pullBottomRight);
		
		body.velocity.x += pullRight.x;
		body.velocity.y += pullRight.y;
		
		return true;
	}
	
	return false;
};

/**
 * Perform a snap collision between the given body and tile, setting the body
 * back to the given current position if it fails.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#snapCollide
 * @param  {Phaser.Physics.Arcade.Body} body    - The translated physics body.
 * @param  {Phaser.Tile}                tile    - The tile.
 * @param  {Phaser.Point}               current - The original position of the body.
 * @return {boolean}                            - Whether the body snapped to the tile.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.snapCollide = function (body, tile, current) {
	if (this.collide(0, body, tile)) {
		return true;
	}
	
	// There was no collision, so reset the body position
	body.position.x = current.x;
	body.position.y = current.y;
	
	return false;
};

/**
 * Determine whether everything required to process a collision is available.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#shouldCollide
 * @param  {Phaser.Physics.Arcade.Body} body - The physics body.
 * @param  {Phaser.Tile}                tile - The tile.
 * @return {boolean}
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.shouldCollide = function (body, tile) {
	return body.enable && body.polygon && body.slopes && tile.collides && tile.slope && tile.slope.polygon;
};

/**
 * Separate the given body and tile from each other and apply any relevant
 * changes to the body's velocity.
 *
 * TODO: Accept a process callback into this method
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#collide
 * @param  {integer}                    i           - The tile index.
 * @param  {Phaser.Physics.Arcade.Body} body        - The physics body.
 * @param  {Phaser.Tile}                tile        - The tile.
 * @param  {boolean}                    overlapOnly - Whether to only check for an overlap.
 * @return {boolean}                                - Whether the body was separated.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.collide = function (i, body, tile, overlapOnly) {
	// Update the body's polygon position and velocity vector
	this.updateValues(body);
	
	// Bail out if we don't have everything we need
	if (!this.shouldCollide(body, tile)) {
		return false;
	}
	
	if (body.isCircle) {
		body.polygon.pos.x += body.halfWidth;
		body.polygon.pos.y += body.halfHeight;
	}
	
	// Update the tile polygon position
	tile.slope.polygon.pos.x = tile.worldX;
	tile.slope.polygon.pos.y = tile.worldY;
	
	var response = new SAT.Response();
	
	// Test for an overlap and bail if there isn't one
	if ((body.isCircle && !SAT.testCirclePolygon(body.polygon, tile.slope.polygon, response)) || (!body.isCircle && !SAT.testPolygonPolygon(body.polygon, tile.slope.polygon, response))) {
		return false;
	}
	
	// If we're only testing for the overlap, we can bail here
	if (overlapOnly) {
		return true;
	}
	
	// Update the overlap properties of the body
	body.overlapX = response.overlapV.x;
	body.overlapY = response.overlapV.y;
	body.slopes.sat.response = response;
	
	// TODO: Invoke a process callback here
	
	// Invert our overlap vectors so that we have them facing outwards
	Phaser.Plugin.ArcadeSlopes.SatSolver.prepareResponse(response);
	
	// Bail out if no separation occurred
	if (!this.separate(body, tile, response)) {
		return false;
	}
	
	// Apply any velocity changes as a result of the collision
	this.applyVelocity(body, tile, response);
	
	// Update the touching and blocked flags of the physics body
	this.updateFlags(body, response);
	
	return true;
};

/**
 * Collide a body with a tile on a specific axis.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#collideOnAxis
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {Phaser.Tile}                tile     - The tile.
 * @param  {SAT.Vector}                 axis     - The axis unit vector.
 * @param  {SAT.Response}               response - The SAT response to use.
 * @return {boolean}                             - Whether the body was separated.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.collideOnAxis = function (body, tile, axis, response) {
	// Update the body's polygon position and velocity vector
	this.updateValues(body);
	
	// Bail out if we don't have everything we need
	if (!this.shouldCollide(body, tile)) {
		return false;
	}
	
	response = response || new SAT.Response();
	
	var separatingAxis = Phaser.Plugin.ArcadeSlopes.SatSolver.isSeparatingAxis(body.polygon, tile.slope.polygon, axis, response);
	
	if (separatingAxis) {
		return false;
	}
	
	Phaser.Plugin.ArcadeSlopes.SatSolver.prepareResponse(response);
	
	if (!this.separate(body, tile, response, true)) {
		return false;
	}
	
	this.applyVelocity(body, tile, response);
	this.updateFlags(body, response);
	
	return true;
};

/**
 * Run a constraint check for the given physics body, tile and response.
 *
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#restrain
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {Phaser.Tile}                tile     - The tile.
 * @param  {SAT.Response}               response - The initial collision response.
 * @return {boolean}                             - Whether the collision was restrained.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.restrain = function (body, tile, response) {
	for (var r in this.restrainers) {
		var restrainer = this.restrainers[r];
		
		// Skip anything without a restrain function
		if (typeof restrainer.restrain !== 'function') {
			continue;
		}
		
		// Bail if the restrainer dealt with the collision by itself
		if (!restrainer.restrain(this, body, tile, response)) {
			return true;
		}
	}
	
	return false;
};

/**
 * Determine whether to separate a body from a tile, given an SAT response.
 *
 * Checks against the tile slope's edge flags.
 *
 * TODO: Support regular tile face flags?
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#shouldSeparate
 * @param  {integer}                    i        - The tile index.
 * @param  {Phaser.Physics.Arcade.Body} body     - The physics body.
 * @param  {Phaser.Tile}                tile     - The tile.
 * @param  {SAT.Response}               response - The initial collision response.
 * @return {boolean}                             - Whether to pursue the narrow phase.
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.shouldSeparate = function (i, body, tile, response) {
	// Bail if the body is disabled or there is no overlap
	if (!(body.enable && response.overlap)) {
		return false;
	}
	
	// Ignore any internal edges identified by the slope factory
	if (tile.slope.edges.top === Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY && response.overlapN.y < 0 && response.overlapN.x === 0) {
		return false;
	}
	
	if (tile.slope.edges.bottom === Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY && response.overlapN.y > 0 && response.overlapN.x === 0) {
		return false;
	}
	
	if (tile.slope.edges.left === Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY && response.overlapN.x < 0 && response.overlapN.y === 0) {
		return false;
	}
	
	if (tile.slope.edges.right === Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY && response.overlapN.x > 0 && response.overlapN.y === 0) {
		return false;
	}
	
	// Only separate when the body is moving into the tile
	if (response.overlapV.clone().scale(-1).dot(body.slopes.velocity) < 0) {
		return false;
	}
	
	// Always separate if restraints are disabled or the body is circular
	if (!this.options.restrain || body.isCircle) {
		return true;
	}
	
	// Run any separation restrainers
	if (this.restrain(body, tile, response)) {
		return false;
	}
	
	return true;
};

/**
 * Render the given SAT response as a set of lines from the given position.
 * 
 * TODO: Actually maybe just collect the lines here for drawing later?
 *       Or, make this static and just something you can call in the
 *       context of a game, or game state.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.SatSolver#debug
 * @param {Phaser.Point} position
 * @param {SAT.Response} response
 */
Phaser.Plugin.ArcadeSlopes.SatSolver.prototype.debug = function (position, response) {
	// TODO: Implement.
};

/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
 * @license MIT
 */

/**
 * Defines the slope of a tile.
 * 
 * @class Phaser.Plugin.ArcadeSlopes.TileSlope
 * @constructor
 * @param {integer}     type    - The type of the tile slope.
 * @param {Phaser.Tile} tile    - The tile this slope definition belongs to.
 * @param {SAT.Polygon} polygon - The polygon representing the shape of the tile.
 * @param {Phaser.Line} line    - The line representing the slope of the tile.
 * @param {object}      edges   - The flags for each edge of the tile.
 * @param {SAT.Vector}  axis    - The preferred axis for separating physics bodies.
 */
Phaser.Plugin.ArcadeSlopes.TileSlope = function (type, tile, polygon, line, edges, axis) {
	/**
	 * The type of the tile slope.
	 * 
	 * @property {integer} type
	 */
	this.type = type;
	
	/**
	 * The tile this slope definition is for.
	 * 
	 * @property {Phaser.Tile} tile
	 */
	this.tile = tile;
	
	/**
	 * The polygon representing the shape of the tile.
	 *
	 * @property {SAT.Polygon} polygon
	 */
	this.polygon = polygon;
	
	/**
	 * The line representing the slope of the tile.
	 *
	 * @property {Phaser.Tile} line
	 */
	this.line = line;
	
	/**
	 * The flags for each edge of the tile; empty, solid or interesting?
	 *
	 * @property {object} edges
	 */
	this.edges = Phaser.Utils.mixin(edges || {}, {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID
	});
	
	/**
	 * The preferred axis for separating physics bodies.
	 *
	 * @property {SAT.Vector} axis
	 */
	this.axis = axis || null;
	
	/**
	 * The preferred solver to use for this slope.
	 * 
	 * @property {string} solver
	 */
	this.solver = null;
	
	/**
	 * The friction of this slope.
	 *
	 * @property {Phaser.Point} friction
	 */
	this.friction = new Phaser.Point();
};

/**
 * Resolve a tile slope type constant from the given value.
 *
 * Returns any successfully parsed non-negative integers regardless of whether
 * they are valid slope tile types. This method is really for strings.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlope#resolveType
 * @param  {string|integer} type - The value to resolve.
 * @return {integer}             - The resolved tile slope type constant.
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.resolveType = function (type) {
	if (parseInt(type) >= 0) {
		return type;
	}
	
	if (typeof type === 'string') {
		type = type.toUpperCase();
	}
	
	if (Phaser.Plugin.ArcadeSlopes.TileSlope.hasOwnProperty(type)) {
		return Phaser.Plugin.ArcadeSlopes.TileSlope[type];
	}
	
	console.warn('Unknown slope type \'' + type + '\'');
	
	return Phaser.Plugin.ArcadeSlopes.TileSlope.UNKNOWN;
};

/**
 * The slope of the tile.
 *
 * @name Phaser.Plugin.ArcadeSlopes.TileSlope#slope
 * @property {number} slope
 */
Object.defineProperty(Phaser.Plugin.ArcadeSlopes.TileSlope.prototype, 'slope', {
	get: function () {
		if (!this.line) {
			return 0;
		}
		
		return (this.line.start.y - this.line.end.y) / (this.line.start.x - this.line.end.x);
	}
});

/**
 * The name of the tile slope type.
 *
 * @name Phaser.Plugin.ArcadeSlopes.TileSlope#typeName
 * @property {string} typeName
 */
Object.defineProperty(Phaser.Plugin.ArcadeSlopes.TileSlope.prototype, 'typeName', {
	get: function () {
		return Phaser.Plugin.ArcadeSlopes.TileSlope.resolveTypeName(this.type);
	},
	set: function (type) {
		this.type = Phaser.Plugin.ArcadeSlopes.TileSlope.resolveType(type);
	}
});

/**
 * Resolve a tile slope type name from the given type constant.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlope#resolveTypeName
 * @param  {integer} type - The type constant.
 * @return {integer}      - The type name.
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.resolveTypeName = function (type) {
	if (Phaser.Plugin.ArcadeSlopes.TileSlope.typeNames.hasOwnProperty(type)) {
		return Phaser.Plugin.ArcadeSlopes.TileSlope.typeNames[type];
	}
	
	return Phaser.Plugin.ArcadeSlopes.TileSlope.typeNames[-1];
};

/**
 * The map of tile slope types to their corresponding type names.
 *
 * @static
 * @property {object} typeNames
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.typeNames = {
	'-1': 'UNKNOWN',
	0:  'FULL',
	21: 'HALF_BOTTOM',
	22: 'HALF_TOP',
	23: 'HALF_LEFT',
	24: 'HALF_RIGHT',
	1:  'HALF_BOTTOM_LEFT',
	2:  'HALF_BOTTOM_RIGHT',
	3:  'HALF_TOP_LEFT',
	4:  'HALF_TOP_RIGHT',
	5:  'QUARTER_BOTTOM_LEFT_LOW',
	6:  'QUARTER_BOTTOM_LEFT_HIGH',
	7:  'QUARTER_BOTTOM_RIGHT_LOW',
	8:  'QUARTER_BOTTOM_RIGHT_HIGH',
	9:  'QUARTER_LEFT_BOTTOM_LOW',
	10: 'QUARTER_LEFT_BOTTOM_HIGH',
	11: 'QUARTER_RIGHT_BOTTOM_LOW',
	12: 'QUARTER_RIGHT_BOTTOM_HIGH',
	13: 'QUARTER_LEFT_TOP_LOW',
	14: 'QUARTER_LEFT_TOP_HIGH',
	15: 'QUARTER_RIGHT_TOP_LOW',
	16: 'QUARTER_RIGHT_TOP_HIGH',
	17: 'QUARTER_TOP_LEFT_LOW',
	18: 'QUARTER_TOP_LEFT_HIGH',
	19: 'QUARTER_TOP_RIGHT_LOW',
	20: 'QUARTER_TOP_RIGHT_HIGH',
};

// TODO: Misleading constants here - they aren't tile slope types, they're edges

/**
 * An empty tile edge.
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY = 0;

/**
 * A solid tile edge.
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID = 1;

/**
 * An interesting tile edge.
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING = 2;

/**
 * An undefined tile slope type.
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.UNKNOWN = -1;

/**
 * A full square tile.
 * .___
 * |   |
 * |___|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.FULL = 0;

/**
 * A half bottom tile.
 * .
 *  ___
 * |___|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM = 21;

/**
 * A half top tile.
 * .___
 * |___|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP = 22;

/**
 * A half left tile.
 * ._
 * | |
 * |_|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_LEFT = 23;

/**
 * A half right tile.
 * .  _
 *   | |
 *   |_|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_RIGHT = 24;

/**
 * A 45 degree bottom left slope.
 *
 * |\
 * | \
 * |__\
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM_LEFT = 1;

/**
 * A 45 degree bottom right slope.
 *
 *   /|
 *  / |
 * /__|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM_RIGHT = 2;

/**
 * A 45 degree top left slope.
 *  __
 * |  /
 * | /
 * |/
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP_LEFT = 3;

/**
 * A 45 degree top right slope.
 *  __
 * \  |
 *  \ |
 *   \|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP_RIGHT = 4;

/**
 * |\
 * | | |\
 * |_| |_\ <--
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_LEFT_LOW = 5;

/**
 *    |\
 *    | | |\
 * -->|_| |_\
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_LEFT_HIGH = 6;

/**
 *         /|
 *     /| | |
 * -->/_| |_|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_RIGHT_LOW = 7;

/**
 *      /|
 *  /| | |
 * /_| |_|<--
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_RIGHT_HIGH = 8;

/**
 * |\
 * |_\
 *  __
 * |  \ <--
 * |___\
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_BOTTOM_LOW = 9;

/**
 * |\
 * |_\ <--
 *  __
 * |  \
 * |___\
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_BOTTOM_HIGH = 10;

/**
 *    /|
 *   /_|
 *   __
 *  /  | <--
 * /___|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_BOTTOM_LOW = 11;

/**
 *    /|
 *   /_| <--
 *   __
 *  /  |
 * /___|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_BOTTOM_HIGH = 12;

/**
 *  ____
 * |    /
 * |___/
 *  __
 * | /  <--
 * |/
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_TOP_LOW = 13;

/**
 *  ____
 * |    / <--
 * |___/
 *  __
 * | /
 * |/
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_TOP_HIGH = 14;

/**
 *  ____
 * \    |
 *  \___|
 *    __
 *    \ | <--
 *     \|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_TOP_LOW = 15;

/**
 *  ____
 * \    | <--
 *  \___|
 *    __
 *    \ |
 *     \|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_TOP_HIGH = 16;

/**
 *  __    __
 * |  |  | / <--
 * |  |  |/
 * | /
 * |/
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_LEFT_LOW = 17;

/**
 *      __    __
 *     |  |  | /
 * --> |  |  |/
 *     | /
 *     |/
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_LEFT_HIGH = 18;

/**
 *    __   __
 *    \ | |  |
 * --> \| |  |
 *         \ |
 *          \|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_RIGHT_LOW = 19;

/**
 * __   __
 * \ | |  |
 *  \| |  | <--
 *      \ |
 *       \|
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_RIGHT_HIGH = 20;

/**
 * @author Chris Andrew <chris@hexus.io>
 * @copyright 2016 Chris Andrew
 * @license MIT
 */

/**
 * Builds TileSlope objects from a set of definition functions.
 * 
 * @class Phaser.Plugin.ArcadeSlopes.TileSlopeFactory
 * @constructor
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory = function () {
	/**
	 * A set of definition functions for the factory to use to build tile slopes
	 * of a given type.
	 * 
	 * Maps slope type constants to definition functions.
	 * 
	 * @property {object} definitions
	 */
	this.definitions = {};
	
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.FULL]                      = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createFull;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM]               = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfBottom;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP]                  = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfTop;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_LEFT]                 = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfLeft;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_RIGHT]                = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfRight;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM_LEFT]          = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfBottomLeft;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_BOTTOM_RIGHT]         = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfBottomRight;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP_LEFT]             = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfTopLeft;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.HALF_TOP_RIGHT]            = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfTopRight;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_LEFT_LOW]   = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomLeftLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_LEFT_HIGH]  = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomLeftHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_RIGHT_LOW]  = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomRightLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_BOTTOM_RIGHT_HIGH] = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomRightHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_BOTTOM_LOW]   = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftBottomLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_BOTTOM_HIGH]  = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftBottomHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_BOTTOM_LOW]  = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightBottomLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_BOTTOM_HIGH] = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightBottomHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_TOP_LOW]      = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftTopLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_LEFT_TOP_HIGH]     = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftTopHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_TOP_LOW]     = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightTopLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_RIGHT_TOP_HIGH]    = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightTopHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_LEFT_LOW]      = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopLeftLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_LEFT_HIGH]     = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopLeftHigh;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_RIGHT_LOW]     = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopRightLow;
	this.definitions[Phaser.Plugin.ArcadeSlopes.TileSlope.QUARTER_TOP_RIGHT_HIGH]    = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopRightHigh;
	
	/**
	 * A set of common slope mapping functions that can be used instead of an
	 * explicit map.
	 * 
	 * Maps TileSlopeFactory constants to mapping functions.
	 * 
	 * @property {object} mappings
	 */
	this.mappings = {};
	
	this.mappings[Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.NINJA] = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.mapNinjaPhysics;
};

Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.constructor = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory;

/**
 * Define a new tile slope type.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#define
 * @param  {integer}  type       - The slope type key.
 * @param  {function} definition - The slope type definition function.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.define = function (type, definition) {
	if (typeof definition !== 'function') {
		return;
	}
	
	this.definitions[type] = definition;
};

/**
 * Create a TileSlope of the given type for the given tile.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#create
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.create = function (type, tile) {
	var original = type;
	
	type = Phaser.Plugin.ArcadeSlopes.TileSlope.resolveType(original);
	
	if (!this.definitions.hasOwnProperty(type)) {
		console.warn('Slope type ' + original + ' not defined');
		
		return null;
	}
	
	if (typeof this.definitions[type] !== 'function') {
		console.warn('Slope type definition for type ' + original + ' is not a function');
		
		return null;
	}
	
	return this.definitions[type].call(this, type, tile);
};

/**
 * Convert a layer of the given tilemap.
 * 
 * Attaches Phaser.Plugin.ArcadeSlopes.TileSlope objects that are used to define
 * how the tile should collide with a physics body.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#convertTilemap
 * @param  {Phaser.Tilemap}                    map      - The map containing the layer to convert.
 * @param  {number|string|Phaser.TileMapLayer} layer    - The layer of the map to convert.
 * @param  {string|object}                     slopeMap - A mapping type string, or a map of tilemap indexes to ArcadeSlope.TileSlope constants.
 * @param  {integer}                           index    - An optional first tile index (firstgid).
 * @return {Phaser.Tilemap}                             - The converted tilemap.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.convertTilemap = function (map, layer, slopeMap, offset) {
	layer = map.getLayer(layer);
	
	this.convertTilemapLayer(layer, slopeMap, offset);
	
	return map;
};

/**
 * Convert a tilemap layer.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#convertTilemapLayer
 * @param  {Phaser.TilemapLayer} layer    - The tilemap layer to convert.
 * @param  {string|object}       slopeMap - A mapping type string, or a map of tilemap indexes to ArcadeSlope.TileSlope constants.
 * @param  {integer}             index    - An optional first tile index (firstgid).
 * @return {Phaser.TilemapLayer}          - The converted tilemap layer.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.convertTilemapLayer = function (layer, slopeMap, index) {
	var that = this;
	
	// Resolve a predefined slope map if a string is given
	if (typeof slopeMap === 'string') {
		var mappingType = this.resolveMappingType(slopeMap);
		
		if (!this.mappings[mappingType]) {
			console.warn('Tilemap could not be converted; mapping type \'' + slopeMap + '\' is unknown');
			
			return layer;
		}
		
		slopeMap = this.mappings[mappingType](index);
	}
	
	// Create the TileSlope objects for each relevant tile in the layer
	layer.layer.data.forEach(function (row) {
		row.forEach(function (tile) {
			if (slopeMap.hasOwnProperty(tile.index)) {
				var slope = that.create(slopeMap[tile.index], tile);
				
				if (slope) {
					tile.slope = slope;
				}
			}
			
			var x = tile.x;
			var y = tile.y;
			
			tile.neighbours = tile.neighbours || {};
			
			// Give each tile references to their eight neighbours
			tile.neighbours.above = layer.map.getTileAbove(layer.index, x, y);
			tile.neighbours.below = layer.map.getTileBelow(layer.index, x, y);
			tile.neighbours.left = layer.map.getTileLeft(layer.index, x, y);
			tile.neighbours.right = layer.map.getTileRight(layer.index, x, y);
			tile.neighbours.topLeft = layer.map.getTileTopLeft(layer.index, x, y);
			tile.neighbours.topRight = layer.map.getTileTopRight(layer.index, x, y);
			tile.neighbours.bottomLeft = layer.map.getTileBottomLeft(layer.index, x, y);
			tile.neighbours.bottomRight = layer.map.getTileBottomRight(layer.index, x, y);
		});
	});
	
	// Calculate the edge flags for each tile in the layer
	this.calculateEdges(layer);
	
	return layer;
};

/**
 * Calculate the edge flags for each tile in the given tilemap layer.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#calculateEdges
 * @param {Phaser.TilemapLayer} layer - The tilemap layer to calculate edge flags for.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.calculateEdges = function (layer) {
	var above = null;
	var below = null;
	var left  = null;
	var right = null;
	
	for (var y = 0, h = layer.layer.height; y < h; y++) {
		for (var x = 0, w = layer.layer.width; x < w; x++) {
			var tile = layer.layer.data[y][x];
			
			if (tile && tile.hasOwnProperty('slope')) {
				above = layer.map.getTileAbove(layer.index, x, y);
				below = layer.map.getTileBelow(layer.index, x, y);
				left  = layer.map.getTileLeft(layer.index, x, y);
				right = layer.map.getTileRight(layer.index, x, y);
				
				if (above && above.hasOwnProperty('slope')) {
					tile.slope.edges.top = this.compareEdges(tile.slope.edges.top, above.slope.edges.bottom);
					tile.collideUp = tile.slope.edges.top !== Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
					this.flagInternalVertices(tile, above);
				}
				
				if (below && below.hasOwnProperty('slope')) {
					tile.slope.edges.bottom = this.compareEdges(tile.slope.edges.bottom, below.slope.edges.top);
					tile.collideDown = tile.slope.edges.bottom !== Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
					this.flagInternalVertices(tile, below);
				}
				
				if (left && left.hasOwnProperty('slope')) {
					tile.slope.edges.left = this.compareEdges(tile.slope.edges.left, left.slope.edges.right);
					tile.collideLeft = tile.slope.edges.left !== Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
					this.flagInternalVertices(tile, left);
				}
				
				if (right && right.hasOwnProperty('slope')) {
					tile.slope.edges.right = this.compareEdges(tile.slope.edges.right, right.slope.edges.left);
					tile.collideRight = tile.slope.edges.right !== Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
					this.flagInternalVertices(tile, right);
				}
			}
		}
	}
};

/**
 * Resolve the given flags of two shared tile edges.
 * 
 * Returns the new flag to use for the first edge after comparing it with the
 * second edge.
 * 
 * This compares AABB edges of each tile, not polygon edges.
 * 
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#compareEdges
 * @param  {integer} firstEdge  - The edge to resolve.
 * @param  {integer} secondEdge - The edge to compare against.
 * @return {integer}            - The resolved edge.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.compareEdges = function (firstEdge, secondEdge) {
	if (firstEdge === Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID && secondEdge === Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID) {
		return Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
	}
	
	if (firstEdge === Phaser.Plugin.ArcadeSlopes.TileSlope.SOLID && secondEdge === Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY) {
		return Phaser.Plugin.ArcadeSlopes.TileSlope.EMPTY;
	}
	
	return firstEdge;
};

/**
 * Compares the polygon edges of two tiles and flags those that match.
 * 
 * Because the polygons are represented by a set of points, instead of actual
 * edges, the first vector (assuming they are specified clockwise) of each
 * potential edge is flagged instead.
 * 
 * TODO: Optimise by bailing if both first vertices are already flagged and
 *       possibly by avoiding SAT.Vector instantiation.
 *
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#flagInternalVertices
 * @param  {Phaser.Tile} firstTile  - The first tile to compare.
 * @param  {Phaser.Tile} secondTile - The second tile to compare.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.flagInternalVertices = function (firstTile, secondTile) {
	// Bail if either tile lacks a polygon
	if (!firstTile.slope.polygon || !secondTile.slope.polygon) {
		return;
	}
	
	var firstPolygon = firstTile.slope.polygon;
	var secondPolygon = secondTile.slope.polygon;
	var firstPosition = new SAT.Vector(firstTile.worldX, firstTile.worldY);
	var secondPosition = new SAT.Vector(secondTile.worldX, secondTile.worldY);
	
	for (var i = 0; i < firstPolygon.points.length; i++) {
		var firstTileVertexOne = firstPolygon.points[i].clone().add(firstPosition);
		var firstTileVertexTwo = firstPolygon.points[(i + 1) % firstPolygon.points.length].clone().add(firstPosition);
		
		for (var j = 0; j < secondPolygon.points.length; j++) {
			var secondTileVertexOne = secondPolygon.points[j].clone().add(secondPosition);
			var secondTileVertexTwo = secondPolygon.points[(j + 1) % secondPolygon.points.length].clone().add(secondPosition);
			
			// Now we can compare vertices for an exact or inverse match
			var exactMatch = firstTileVertexOne.x === secondTileVertexOne.x &&
				firstTileVertexOne.y === secondTileVertexOne.y &&
				firstTileVertexTwo.x === secondTileVertexTwo.x &&
				firstTileVertexTwo.y === secondTileVertexTwo.y;
			
			var inverseMatch = firstTileVertexOne.x === secondTileVertexTwo.x &&
				firstTileVertexOne.y === secondTileVertexTwo.y &&
				firstTileVertexTwo.x === secondTileVertexOne.x &&
				firstTileVertexTwo.y === secondTileVertexOne.y;
			
			// Flag the vertices that begin the edge
			if (exactMatch || inverseMatch) {
				firstPolygon.points[i].internal = true;
				secondPolygon.points[j].internal = true;
			}
		}
	}
};

/**
 * Resolve a tileset mapping constant from the given value.
 * 
 * @method Phaser.Plugin.Arcadeslopes.TileSlopeFactory#resolveMapping
 * @param  {string}  type - The value to resolve a mapping from.
 * @return {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prototype.resolveMappingType = function (type) {
	if (parseInt(type) >= 0) {
		return type;
	}
	
	if (typeof type === 'string') {
		type = type.toUpperCase();
	}
	
	if (Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.hasOwnProperty(type)) {
		return Phaser.Plugin.ArcadeSlopes.TileSlopeFactory[type];
	}
	
	console.warn('Unknown tileset mapping type \'' + type + '\'');
	
	return -1;
};

/**
 * Define a full square tile.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createFull
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createFull = function (type, tile) {
	var polygon = new SAT.Box(
		new SAT.Vector(tile.worldX, tile.worldY),
		tile.width,
		tile.height
	).toPolygon();
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon);
};

/**
 * Define a bottom half tile.
 * 
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfBottom
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfBottom = function (type, tile) {
	var halfHeight = tile.height / 2;
	
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, halfHeight),
		new SAT.Vector(tile.width, halfHeight),
		new SAT.Vector(tile.width, tile.height),
		new SAT.Vector(0, tile.height)
	]);
	
	var line = new Phaser.Line(tile.left, tile.top + tile.height / 2, tile.right, tile.top + tile.height / 2);
	
	var edges = {
		top:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges);
};

/**
 * Define a top half tile.
 * 
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfTop
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfTop = function (type, tile) {
	var halfHeight = tile.height / 2;
	
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),
		new SAT.Vector(tile.width, 0),
		new SAT.Vector(tile.width, halfHeight),
		new SAT.Vector(0, halfHeight)
	]);
	
	var line = new Phaser.Line(tile.left, tile.top, tile.right, tile.top);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges);
};

/**
 * Define a left half tile.
 * 
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfLeft
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfLeft = function (type, tile) {
	var halfWidth = tile.width / 2;
	
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),
		new SAT.Vector(halfWidth, 0),
		new SAT.Vector(halfWidth, tile.height),
		new SAT.Vector(0, tile.height)
	]);
	
	var line = new Phaser.Line(tile.left + halfWidth, tile.top, tile.left + halfWidth, tile.bottom);
	
	var edges = {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges);
};

/**
 * Define a right half tile.
 * 
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfRight
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfRight = function (type, tile) {
	var halfWidth = tile.width / 2;
	
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(halfWidth, 0),
		new SAT.Vector(tile.width, 0),
		new SAT.Vector(tile.width, tile.height),
		new SAT.Vector(halfWidth, tile.height)
	]);
	
	var line = new Phaser.Line(tile.left + halfWidth, tile.top, tile.left + halfWidth, tile.bottom);
	
	var edges = {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges);
};

/**
 * Define a 45 degree bottom left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfBottomLeft
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfBottomLeft = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                    // Top left
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height)           // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.top, tile.right, tile.bottom);
	
	var edges = {
		top:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.7071067811865475, -0.7071067811865475);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a 45 degree bottom right slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfBottomRight
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfBottomRight = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(tile.width, 0),           // Top right
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height)           // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.bottom, tile.right, tile.top);
	
	var edges = {
		top:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.707106781186548, -0.707106781186548);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a 45 degree top left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfTopLeft
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfTopLeft = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),          // Top left
		new SAT.Vector(tile.width, 0), // Top right
		new SAT.Vector(0, tile.height) // Bottom right
	]);
	
	var line = new Phaser.Line(tile.right, tile.top, tile.left, tile.bottom);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.7071067811865475, 0.7071067811865475);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a 45 degree top left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createHalfTopRight
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createHalfTopRight = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                   // Top left
		new SAT.Vector(tile.width, 0),          // Top right
		new SAT.Vector(tile.width, tile.height) // Bottom right
	]);
	
	var line = new Phaser.Line(tile.right, tile.bottom, tile.left, tile.top);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.7071067811865475, 0.7071067811865475);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a lower 22.5 degree bottom left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterBottomLeftLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomLeftLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, tile.height / 2),      // Center left
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height)           // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.top + tile.height / 2, tile.right, tile.bottom);
	
	var edges = {
		top:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.4472135954999579, -0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree bottom left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterBottomLeftHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomLeftHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                        // Top left
		new SAT.Vector(tile.width, tile.height / 2), // Center right
		new SAT.Vector(tile.width, tile.height),     // Bottom right
		new SAT.Vector(0, tile.height)               // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.top, tile.right, tile.top + tile.height / 2);
	
	var edges = {
		top:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.4472135954999579, -0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a lower 22.5 degree bottom right slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterBottomRightLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomRightLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(tile.width, tile.height / 2), // Center right
		new SAT.Vector(tile.width, tile.height),     // Bottom right
		new SAT.Vector(0, tile.height)               // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.bottom, tile.right, tile.top + tile.height / 2);
	
	var edges = {
		top:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.4472135954999579, -0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree bottom right slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterBottomRightHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterBottomRightHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, tile.height / 2),      // Center left
		new SAT.Vector(tile.width, 0),           // Top right
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height)           // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.bottom, tile.right, tile.top + tile.height / 2);
	
	var edges = {
		top:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.4472135954999579, -0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};


/**
 * Define a lower 22.5 degree left bottom slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterLeftBottomLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftBottomLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                    // Top left
		new SAT.Vector(tile.width / 2, 0),       // Top center
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height)           // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left + tile.width / 2, tile.top, tile.right, tile.bottom);
	
	var edges = {
		top:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.8944271909999159, -0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree left bottom slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterLeftBottomHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftBottomHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                        // Top left
		new SAT.Vector(tile.width / 2, tile.height), // Bottom center
		new SAT.Vector(0, tile.height)               // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.top, tile.left + tile.width / 2, tile.bottom);
	
	var edges = {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.8944271909999159, -0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};


/**
 * Define a lower 22.5 degree right bottom slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterRightBottomLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightBottomLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(tile.width / 2, 0),       // Top center
		new SAT.Vector(tile.width, 0),           // Top right
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height)           // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.bottom, tile.left + tile.width / 2, tile.top);
	
	var edges = {
		top:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.8944271909999159, -0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};


/**
 * Define an upper 22.5 degree right bottom slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterRightBottomHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightBottomHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(tile.width, 0),              // Top right
		new SAT.Vector(tile.width, tile.height),    // Bottom right
		new SAT.Vector(tile.width / 2, tile.height) // Bottom center
	]);
	
	var line = new Phaser.Line(tile.left + tile.width / 2, tile.bottom, tile.right, tile.top);
	
	var edges = {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.8944271909999159, -0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a lower 22.5 degree left top slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterLeftTopLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftTopLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),              // Top left
		new SAT.Vector(tile.width / 2, 0), // Top center
		new SAT.Vector(0, tile.height)     // Bottom left
	]);
	
	var line = new Phaser.Line(0, tile.height, tile.width / 2, 0);
	
	var edges = {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.8944271909999159, 0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree left top slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterLeftTopHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterLeftTopHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                        // Top left
		new SAT.Vector(tile.width, 0),               // Top right
		new SAT.Vector(tile.width / 2, tile.height), // Bottom center
		new SAT.Vector(0, tile.height)               // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left + tile.width / 2, tile.bottom, tile.right, tile.bottom);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.8944271909999159, 0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a lower 22.5 degree right top slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterRightTopLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightTopLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(tile.width / 2, 0),      // Top center
		new SAT.Vector(tile.width, 0),          // Top right
		new SAT.Vector(tile.width, tile.height) // Bottom right
	]);
	
	var line = new Phaser.Line(tile.left + tile.width / 2, tile.top, tile.right, tile.bottom);
	
	var edges = {
		top:    Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.8944271909999159, 0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree right top slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterRightTopHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterRightTopHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                       // Top left
		new SAT.Vector(tile.width, 0),              // Top right
		new SAT.Vector(tile.width, tile.height),    // Bottom right
		new SAT.Vector(tile.width / 2, tile.height) // Bottom center
	]);
	
	var line = new Phaser.Line(tile.left, tile.top, tile.left + tile.width / 2, tile.bottom);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.8944271909999159, 0.4472135954999579);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a lower 22.5 degree top left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterTopLeftLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopLeftLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),              // Top left
		new SAT.Vector(tile.width, 0),     // Top right
		new SAT.Vector(0, tile.height / 2) // Center left
	]);
	
	var line = new Phaser.Line(tile.left, tile.top + tile.height / 2, tile.right, tile.top);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.4472135954999579, 0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree top left slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterTopLeftHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopLeftHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                        // Top left
		new SAT.Vector(tile.width, 0),               // Top right
		new SAT.Vector(tile.width, tile.height / 2), // Right center
		new SAT.Vector(0, tile.height)               // Bottom left
	]);
	
	var line = new Phaser.Line(tile.left, tile.bottom, tile.right, tile.top + tile.height / 2);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(0.4472135954999579, 0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define a lower 22.5 degree top right slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterTopRightLow
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopRightLow = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                       // Top left
		new SAT.Vector(tile.width, 0),              // Top right
		new SAT.Vector(tile.width, tile.height / 2) // Right center
	]);
	
	var line = new Phaser.Line(tile.left, tile.top, tile.right, tile.top + tile.height / 2);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		right:  Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.4472135954999579, 0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Define an upper 22.5 degree top right slope.
 *
 * @static
 * @method Phaser.Plugin.ArcadeSlopes.TileSlopeFactory#createQuarterTopRightHigh
 * @param  {integer}     type                     - The slope type.
 * @param  {Phaser.Tile} tile                     - The tile object.
 * @return {Phaser.Plugin.ArcadeSlopes.TileSlope} - The defined tile slope.
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.createQuarterTopRightHigh = function (type, tile) {
	var polygon = new SAT.Polygon(new SAT.Vector(tile.worldX, tile.worldY), [
		new SAT.Vector(0, 0),                    // Top left
		new SAT.Vector(tile.width, 0),           // Top right
		new SAT.Vector(tile.width, tile.height), // Bottom right
		new SAT.Vector(0, tile.height / 2)       // Left center
	]);
	
	var line = new Phaser.Line(tile.left, tile.top + tile.height / 2, tile.right, tile.top + tile.height);
	
	var edges = {
		bottom: Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING,
		left:   Phaser.Plugin.ArcadeSlopes.TileSlope.INTERESTING
	};
	
	var axis = new SAT.Vector(-0.4472135954999579, 0.8944271909999159);
	
	return new Phaser.Plugin.ArcadeSlopes.TileSlope(type, tile, polygon, line, edges, axis);
};

/**
 * Prepare a slope mapping offset from the given tile index.
 * 
 * An offset is just the first tile index - 1. Returns 0 if an integer can't be
 * parsed.
 * 
 * @static
 * @param  {integer} index - A tile index.
 * @return {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prepareOffset = function (index) {
	var offset = parseInt(index);
	
	offset = !isNaN(offset) && typeof offset === 'number' ? offset - 1 : 0;
	
	return offset;
};

/**
 * Create a tile slope mapping for the Ninja Physics tileset.
 *
 * @static
 * @param  {integer} index - An optional first tile index (firstgid).
 * @return {object}
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.mapNinjaPhysics = function (index) {
	offset = Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.prepareOffset(index);
	
	var mapping = {};
	
	mapping[offset + 2] =  'FULL';
	mapping[offset + 3] =  'HALF_BOTTOM_LEFT';
	mapping[offset + 4] =  'HALF_BOTTOM_RIGHT';
	mapping[offset + 6] =  'HALF_TOP_LEFT';
	mapping[offset + 5] =  'HALF_TOP_RIGHT';
	mapping[offset + 15] = 'QUARTER_BOTTOM_LEFT_LOW';
	mapping[offset + 16] = 'QUARTER_BOTTOM_RIGHT_LOW';
	mapping[offset + 17] = 'QUARTER_TOP_RIGHT_LOW';
	mapping[offset + 18] = 'QUARTER_TOP_LEFT_LOW';
	mapping[offset + 19] = 'QUARTER_BOTTOM_LEFT_HIGH';
	mapping[offset + 20] = 'QUARTER_BOTTOM_RIGHT_HIGH';
	mapping[offset + 21] = 'QUARTER_TOP_RIGHT_HIGH';
	mapping[offset + 22] = 'QUARTER_TOP_LEFT_HIGH';
	mapping[offset + 23] = 'QUARTER_LEFT_BOTTOM_HIGH';
	mapping[offset + 24] = 'QUARTER_RIGHT_BOTTOM_HIGH';
	mapping[offset + 25] = 'QUARTER_RIGHT_TOP_LOW';
	mapping[offset + 26] = 'QUARTER_LEFT_TOP_LOW';
	mapping[offset + 27] = 'QUARTER_LEFT_BOTTOM_LOW';
	mapping[offset + 28] = 'QUARTER_RIGHT_BOTTOM_LOW';
	mapping[offset + 29] = 'QUARTER_RIGHT_TOP_HIGH';
	mapping[offset + 30] = 'QUARTER_LEFT_TOP_HIGH';
	mapping[offset + 31] = 'HALF_BOTTOM';
	mapping[offset + 32] = 'HALF_RIGHT';
	mapping[offset + 33] = 'HALF_TOP';
	mapping[offset + 34] = 'HALF_LEFT';

	return mapping;
};

/**
 * The Ninja Physics tileset mapping.
 *
 * @constant
 * @type {integer}
 */
Phaser.Plugin.ArcadeSlopes.TileSlopeFactory.NINJA = 1;
