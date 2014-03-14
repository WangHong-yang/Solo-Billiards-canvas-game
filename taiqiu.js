$(document).ready(function() {
	var canvas = $('#gameCanvas');
	var context = canvas.get(0).getContext('2d');

	// The size of canvas
	var canvasWidth = canvas.width();
	var canvasHeight = canvas.height();

	// Set playGame
	var playGame;
	var platformX;
	var platformY;
	var platformWidth;
	var platformHeight;
	var playerOriginalX = 175;
	var playerOriginalY = 500;
	var billiards; // the set for billiards
	var holes; // the set for holes
	var playerSelected; // boolean
	var playerMaxAbsVelocity; 
	var playerVelocityDampener; // calculate the tiny changes of velocity
	var powerX;
	var powerY; // powerX/Y: the mouse's position to determine the velocity of the ball, and draw a white line to show the amount.
	var score;

	// UI elements
	var ui = $('#gameUI');
	var uiIntro = $('#gameIntro');
	var uiStats = $('#gameStats');
	var uiComplete = $('#gameComplete');
	var uiPlay = $('#gamePlay');
	var uiReset = $('.gameReset');
	var uiRemaining = $('#gameRemaining');
	var uiScore = $('.gameScore');

	// Class that defines new billiards & holes to draw
	var Billiard = function(x, y, radius, color, mass, friction) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
		this.mass = mass;
		this.friction = friction;
		
		this.vX = 0;
		this.vY = 0;
		
		this.player = false; // To distinguish with player's ball
	};
	var Hole = function(x, y, radius) {
		this.x = x;
		this.y = y;
		this.radius = radius;
	}

	// Start(Reset) the initial numbers of the game
	function startGame() {
		uiScore.html('0');
		uiStats.show();

		playGame = false;
		platformX = 10;
		platformY = 70;
		platformWidth = 330;
		platformHeight = 520;
		billiards = new Array();
		holes = new Array();
		playerSelected = false;
		playerMaxAbsVelocity = 30;
		playerVelocityDampener = 0.3;
		powerX = -1;
		powerY = -1;
		score = 0;

		// Set player billiards
		var pRadius = 10;
		var pMass = 5;
		var pFriction = 0.96;
		player = new Billiard(playerOriginalX, playerOriginalY, pRadius, 'white', pMass, pFriction);
		player.player = true;
		billiards.push(player);

		// Set other billiards
		for (var i = 0; i < 15; i++) {
			// the red ball
			var x = 0;
			var y = 0;
			var radius = 10;
			var color = '#E74C3C';
			var mass = 5;
			var friction = 0.96;
			billiards.push(new Billiard(x, y, radius, color, mass, friction));
		}
			billiards[1].x = 175; billiards[1].y = 200;
			billiards[2].x = 165; billiards[2].y = 182.5;
			billiards[3].x = 185; billiards[3].y = 182.5;
			billiards[4].x = 155; billiards[4].y = 165;
			billiards[5].x = 175; billiards[5].y = 165;
			billiards[6].x = 195; billiards[6].y = 165;
			billiards[7].x = 145; billiards[7].y = 147.5;
			billiards[8].x = 165; billiards[8].y = 147.5;
			billiards[9].x = 185; billiards[9].y = 147.5;
			billiards[10].x = 205; billiards[10].y = 147.5;
			billiards[11].x = 135; billiards[11].y = 130;
			billiards[12].x = 155; billiards[12].y = 130;
			billiards[13].x = 175; billiards[13].y = 130;
			billiards[14].x = 195; billiards[14].y = 130;
			billiards[15].x = 215; billiards[15].y = 130;

			// the black ball
			billiards.push(new Billiard(175, 97, 10, '#000000', 5, 0.96));
			// the pink ball
			billiards.push(new Billiard(175, 221, 10, '#FFC0CB', 5, 0.96));
			// the blue ball
			billiards.push(new Billiard(175, 330, 10, '#0000FF', 5, 0.96));
			// the brown ball
			billiards.push(new Billiard(175, 430, 10, '#A52A2A', 5, 0.96));
			// the green ball
			billiards.push(new Billiard(93, 430, 10, '#008000', 5, 0.96));
			// the yellow ball
			billiards.push(new Billiard(257, 430, 10, '#FFFF00', 5, 0.96));

		// Set holes
		for (var i = 0; i < 6; i++) {
			// 6 holes
			var x = 0;
			var y = 0;
			var radius = 19;

			holes.push(new Hole(x, y, radius));
		}
			holes[0].x = 13; holes[0].y = 73;
			holes[1].x = 337; holes[1].y = 73;
			holes[2].x = 6; holes[2].y = 330;
			holes[3].x = 344; holes[3].y = 330;
			holes[4].x = 13; holes[4].y = 587;
			holes[5].x = 337; holes[5].y = 587;

		uiRemaining.html(billiards.length-1);

		$(window).mousedown(function(e) {
			if (!playerSelected ) {
				var canvasOffset = canvas.offset();
				var canvasX = Math.floor(e.pageX-canvasOffset.left);
				var canvasY = Math.floor(e.pageY-canvasOffset.top);
				
				if (!playGame) {
					playGame = true;
					animate();
				};
				
				var dX = player.x-canvasX;
				var dY = player.y-canvasY;
				var distance = Math.sqrt((dX*dX)+(dY*dY));
				var padding = 5; // make player easier to click the player's ball
				
				if (distance < player.radius + padding) {
					powerX = player.x;
					powerY = player.y;
					playerSelected = true;
				};
			};
		});
		$(window).mousemove(function(e) {
			if (playerSelected) {
				var canvasOffset = canvas.offset();
				var canvasX = Math.floor(e.pageX-canvasOffset.left);
				var canvasY = Math.floor(e.pageY-canvasOffset.top);
			
				var dX = canvasX-player.x;
				var dY = canvasY-player.y;
				var distance = Math.sqrt((dX*dX)+(dY*dY));
				
				if (distance*playerVelocityDampener < playerMaxAbsVelocity) {
					powerX = canvasX;
					powerY = canvasY;
				} else {
					var ratio = playerMaxAbsVelocity/(distance*playerVelocityDampener);
					powerX = player.x+(dX*ratio);
					powerY = player.y+(dY*ratio);
				};
			};	
		});
		$(window).mouseup(function(e) {
			if (playerSelected) {
				var dX = powerX-player.x;
				var dY = powerY-player.y;

				player.vX = -(dX*playerVelocityDampener);
				player.vY = -(dY*playerVelocityDampener);
				uiScore.html(++score);
			};
			
			playerSelected = false;
			powerX = -1;
			powerY = -1;
		});

		animate();
	};

	// Init the game
	function init() {
		uiStats.hide();
		uiComplete.hide();

		uiPlay.click(function(e) {
			e.preventDefault();
			uiIntro.hide();
			startGame();
		});

		uiReset.click(function(e) {
			e.preventDefault();
			uiComplete.hide();
			startGame();
		});
	};

	// animate
	function animate() {
		// clear 
		context.clearRect(0, 0, canvasWidth, canvasHeight);

		// Draw platform
		context.fillStyle = 'rgb(39, 174, 96)';
		context.fillRect(platformX, platformY, platformWidth, platformHeight);

		// Draw player power line
		if (playerSelected) {
			context.strokeStyle = "rgb(255, 255, 255)";
			context.lineWidth = 3;
			context.beginPath();
			context.moveTo(player.x, player.y);
			context.lineTo(powerX, powerY);
			context.closePath();
			context.stroke();
		};

		// draw all the holes		
		for (var i = 0; i < 6; i++) {
			context.fillStyle = '#001022';
			context.beginPath();
			context.arc(holes[i].x, holes[i].y, holes[i].radius, holes[i].radius, 0, Math.PI*2, true);
			context.closePath();
			context.fill();
		}
		// player's ball
		//context.fillStyle = billiards[0].color;
		//context.beginPath();
		//context.arc(billiards[0].x, billiards[0].y, billiards[0].radius, billiards[0].radius, 0, Math.PI*2, true);
		//context.closePath();
		//context.fill();
		// red ball
		for (var i = 0; i < billiards.length; i++) {
			context.fillStyle = billiards[i].color;
			context.beginPath();
			context.arc(billiards[i].x, billiards[i].y, billiards[i].radius, billiards[i].radius, 0, Math.PI*2, true);
			context.closePath();
			context.fill();
		}
		// for (var i = 16; i < 22; i++) {
		// 	// from black ball to yellow ball
		// 	context.fillStyle = billiards[i].color;
		// 	context.beginPath();
		// 	context.arc(billiards[i].x, billiards[i].y, billiards[i].radius, billiards[i].radius, 0, Math.PI*2, true);
		// 	context.closePath();
		// 	context.fill();
		// }
		
		var deadBilliards = new Array();
		for (var i = 0; i < billiards.length; i++) {
			var tmpBilliard = billiards[i];
			
			for (var j = i+1; j < billiards.length; j++) {
				var tmpBilliardB = billiards[j];
				
				var dX = tmpBilliardB.x - tmpBilliard.x;
				var dY = tmpBilliardB.y - tmpBilliard.y;
				var distance = Math.sqrt((dX*dX)+(dY*dY));
				
				if (distance < tmpBilliard.radius + tmpBilliardB.radius) {								
					var angle = Math.atan2(dY, dX);
					var sine = Math.sin(angle);
					var cosine = Math.cos(angle);
					
					// Rotate asteroid position
					var x = 0;
					var y = 0;
					
					// Rotate asteroidB position
					var xB = dX * cosine + dY * sine;
					var yB = dY * cosine - dX * sine;
						
					// Rotate asteroid velocity
					var vX = tmpBilliard.vX * cosine + tmpBilliard.vY * sine;
					var vY = tmpBilliard.vY * cosine - tmpBilliard.vX * sine;
					
					// Rotate asteroidB velocity
					var vXb = tmpBilliardB.vX * cosine + tmpBilliardB.vY * sine;
					var vYb = tmpBilliardB.vY * cosine - tmpBilliardB.vX * sine;
					
					// Conserve momentum
					var vTotal = vX - vXb;
					vX = ((tmpBilliard.mass - tmpBilliardB.mass) * vX + 2 * tmpBilliardB.mass * vXb) / (tmpBilliard.mass + tmpBilliardB.mass);
					vXb = vTotal + vX;
					
					// Move asteroids apart
					// CHANGE THIS IN PREVIOUS CHAPTER
					xB = x + (tmpBilliard.radius + tmpBilliardB.radius);
					
					// Rotate asteroid positions back
					tmpBilliard.x = tmpBilliard.x + (x * cosine - y * sine);
					tmpBilliard.y = tmpBilliard.y + (y * cosine + x * sine);
					
					tmpBilliardB.x = tmpBilliard.x + (xB * cosine - yB * sine);
					tmpBilliardB.y = tmpBilliard.y + (yB * cosine + xB * sine);
					
					// Rotate asteroid velocities back
					tmpBilliard.vX = vX * cosine - vY * sine;
					tmpBilliard.vY = vY * cosine + vX * sine;
					
					tmpBilliardB.vX = vXb * cosine - vYb * sine;
					tmpBilliardB.vY = vYb * cosine + vXb * sine;
				};
			};
			// Calculate new position
			tmpBilliard.x += tmpBilliard.vX;
			tmpBilliard.y += tmpBilliard.vY;
			
			// Friction
			if (Math.abs(tmpBilliard.vX) > 0.2) {
				tmpBilliard.vX *= tmpBilliard.friction;
			} else {
				tmpBilliard.vX = 0;
			};
			
			if (Math.abs(tmpBilliard.vY) > 0.2) {
				tmpBilliard.vY *= tmpBilliard.friction;
			} else {
				tmpBilliard.vY = 0;
			};

			// Fall into holes checks
				var dXp_LeftTop = tmpBilliard.x - 13;
				var dYp_LeftTop = tmpBilliard.y - 73;
				var dXp_RightTop = tmpBilliard.x - 337;
				var dYp_RightTop = tmpBilliard.y - 73;
				var dXp_LeftMid = tmpBilliard.x - 6;
				var dYp_LeftMid = tmpBilliard.y - 330;
				var dXp_RihtMid = tmpBilliard.x - 344;
				var dYp_RihtMid = tmpBilliard.y - 330;
				var dXp_LeftBot = tmpBilliard.x - 13;
				var dYp_LeftBot = tmpBilliard.y - 587;
				var dXp_RightBot = tmpBilliard.x - 337;
				var dYp_RightBot = tmpBilliard.y - 587;

				var distanceP_LeftTop = Math.sqrt((dXp_LeftTop * dXp_LeftTop) + (dYp_LeftTop * dYp_LeftTop));
				var distanceP_RightTop = Math.sqrt((dXp_RightTop * dXp_RightTop) + (dYp_RightTop * dYp_RightTop));
				var distanceP_LeftMid = Math.sqrt((dXp_LeftMid * dXp_LeftMid) + (dYp_LeftMid * dYp_LeftMid));
				var distanceP_RihtMid = Math.sqrt((dXp_RihtMid * dXp_RihtMid) + (dYp_RihtMid * dYp_RihtMid));
				var distanceP_LeftBot = Math.sqrt((dXp_LeftBot * dXp_LeftBot) + (dYp_LeftBot * dYp_LeftBot));
				var distanceP_RightBot = Math.sqrt((dXp_RightBot * dXp_RightBot) + (dYp_RightBot * dYp_RightBot));
			if (!tmpBilliard.player) {
				var widthJudger = 19; //Use this to control the difficulty of this game
				if ((distanceP_LeftTop < widthJudger) || (distanceP_RightTop < widthJudger) || (distanceP_LeftMid < widthJudger) || (distanceP_RihtMid < widthJudger) || (distanceP_LeftBot < widthJudger) || (distanceP_RightBot < widthJudger)) {
					if (tmpBilliard.radius > 0) {
						tmpBilliard.radius -= 2;
						tmpBilliard.vX = 0;
						tmpBilliard.vY = 0;
					} else  {
						deadBilliards.push(tmpBilliard);
					};
				};
			} else {
				if ((distanceP_LeftTop < 19) || (distanceP_RightTop < 19) || (distanceP_LeftMid < 19) || (distanceP_RihtMid < 19) || (distanceP_LeftBot < 19) || (distanceP_RightBot < 19)) {
					player.x = playerOriginalX;
					player.y = playerOriginalY;
					player.vX = 0;
					player.vY = 0;
				};
			};

			// Set border to prevent abberation
			if (tmpBilliard.x - tmpBilliard.radius < 10) {
				tmpBilliard.x = tmpBilliard.radius + 10;
				tmpBilliard.vX *= -1;
			} else if (tmpBilliard.x + tmpBilliard.radius > 340) {
				tmpBilliard.x = 340 - tmpBilliard.radius;
				tmpBilliard.vX *= -1;
			};

			if (tmpBilliard.y - tmpBilliard.radius < 70) {
				tmpBilliard.y = tmpBilliard.radius + 70;
				tmpBilliard.vY *= -1;
			} else if (tmpBilliard.y + tmpBilliard.radius > 590) {
				tmpBilliard.y = 590 - tmpBilliard.radius;
				tmpBilliard.vY *= -1;
			};
		};
		
		if (deadBilliards.length > 0) {
			for (var di = 0; di < deadBilliards.length; di++) {
				var tmpDeadBilliard = deadBilliards[di];
				billiards.splice(billiards.indexOf(tmpDeadBilliard), 1);
			};
			
			var remaining = billiards.length - 1; // Remove player from asteroid count
			uiRemaining.html(remaining);
			
			if (remaining == 0) {
				// Winner!
				playGame = false;
				uiStats.hide();
				uiComplete.show();

				// Reset event handlers
				$(window).unbind("mousedown");
				$(window).unbind("mouseup");
				$(window).unbind("mousemove");
			};
		};

		if (playGame) {
			// use setTimeout, loop by animate
			setTimeout(animate, 21);
		}
	};

	init();
});