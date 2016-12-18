import Stages from '../config/Stages';

var Stage = {
	create: function (game, engine, bgImageName) {

		let bgImage = null,
			tunnel = null;

		bgImage = game.add.tileSprite(0, 0, 
	        game.width, 
	        game.height, 
	        bgImageName
		);
		bgImage.fixedToCamera = true;

	    tunnel = game.add.group();
	    tunnel.enableBody = true;
	    tunnel.physicsBodyType = engine;

		return {
			bgImage: bgImage,
			tunnel:tunnel
		};

	},

	moveObstacles: function (obsticles, speed) {
		
		// move the blocks left.
	    obsticles.forEach(function(item) {
	        item.x -= speed;
	    });

	},

	moveBackground: function (stage, position) {

		stage.tilePosition.x -= position;
    
	},

	generateTunnel(game, options) {

	    var lastCeiling = options.ceiling[options.ceiling.length-1],
	        lastFloor = options.floor[options.floor.length-1],
	        heightCeiling = 1,
	        heightFloor = 1,
	        firstTemp = null,
	        ceiling = options.ceiling,
	        floor = options.floor;
	    
	    firstTemp = ceiling.shift();
    	firstTemp = floor.shift();
    
    	if (options.bufferCeiling.length > 0) {
    		heightCeiling = options.bufferCeiling.shift();
    	} else {
    		heightCeiling = game.rnd.integerInRange(Math.max(1,lastCeiling-1), Math.min(lastCeiling+1, options.maxHeight));	
    	}

    	if (options.bufferFloor.length > 0) {
    		heightFloor = options.bufferFloor.shift();
    	} else {    
		    heightFloor = game.rnd.integerInRange(Math.max(1,lastFloor-1), Math.min(lastFloor+1, options.maxHeight));
		}

	    while((heightCeiling + heightFloor) > 19) {
	        heightCeiling = heightCeiling - 1;
	        heightFloor = heightFloor - 1;
	    }

	    ceiling.push(heightCeiling);
	    floor.push(heightFloor);

	    return {
	    	ceiling:ceiling,
	    	floor:floor
	    }
	},

	generatePreBuffers: function (options) {
		let buffer = {
				"ceiling":[],
				"floor":[]
			},
			lastCeilingPosition = 1,
			lastFloorPosition = 1,
			ceilingSteps = 1,
			floorSteps = 1,
			equalizerSteps = 0;
		
		ceilingSteps = lastCeilingPosition = options.ceiling[options.ceiling.length-1];
		floorSteps = lastFloorPosition = options.floor[options.floor.length-1]; 
		
		while(lastCeilingPosition > 1) {
			buffer.ceiling.push(lastCeilingPosition);
			lastCeilingPosition--;
		}

		while(lastFloorPosition > 1) {
			buffer.floor.push(lastFloorPosition);
			lastFloorPosition--;
		}

		if (ceilingSteps > floorSteps) {
			
			equalizerSteps = ceilingSteps - floorSteps;

			while(equalizerSteps > 1) {
				buffer.floor.push(1);
				equalizerSteps--;
			}

		} else if (ceilingSteps < floorSteps) {
			
			equalizerSteps = floorSteps - ceilingSteps;

			while(equalizerSteps > 1) {
				buffer.ceiling.push(1);
				equalizerSteps--;
			}

		}

		return buffer;
	},

	useStage: function (game, options) {

		let buffer = {
				ceiling
			},
			ceiling = [],
			floor = [],
			preBuffers = null,
			stagePosition = game.rnd.integerInRange(0, Stages.count-1);

		preBuffers = this.generatePreBuffers(options);

		Array.prototype.push.apply(ceiling, preBuffers.ceiling);
		Array.prototype.push.apply(floor, preBuffers.floor);

		Array.prototype.push.apply(ceiling, Stages[stagePosition].ceiling);
		Array.prototype.push.apply(floor, Stages[stagePosition].floor);

		return {
			ceiling:ceiling,
			floor:floor
		}
	},

	createRock(game, tunnelGroup, x, y, callback, scope, options) {

		let rock = tunnelGroup.create(x, y, 'rock');

	    rock.checkWorldBounds = true;
	    rock.events.onOutOfBounds.add(callback, scope, 0, game, options);
	},

	switchCeiling(rock, game, options) {
	    var bufferResults = null,
	    	lastCeiling = null,
	    	useStage = game.rnd.integerInRange(0, options.usedStageRandomness),
	    	generatedTunnel = {};

	    if (options.bufferCeiling.length === 0 && useStage > options.usedStageRandomness - 10) {

			bufferResults = Stage.useStage(game, options);
			options.bufferCeiling = bufferResults.ceiling;
			options.bufferFloor = bufferResults.floor;
	    }
	    	
	    lastCeiling = options.ceiling[options.ceiling.length-1];
	    
	   	generatedTunnel = Stage.generateTunnel(game, options);
	   	options.ceiling = generatedTunnel.ceiling;
	   	options.floor = generatedTunnel.floor;

	    rock.x = (options.rockWidth * options.spritesPerRowPlusBuffer) + rock.x;
	    rock.y = (lastCeiling * 24) - options.rockHeight;
	},

	switchFloor(rock, game, options) {

	    var lastFloor = null;

	    // Generation is handled in switchCeiling

	    lastFloor = options.floor[options.floor.length-1];
	    
	    rock.x = (options.rockWidth * options.spritesPerRowPlusBuffer) + rock.x;
	    rock.y = game.height - ((lastFloor + 1) * 24); 
	}
};

export default Stage;