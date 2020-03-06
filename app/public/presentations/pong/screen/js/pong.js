/*------TimeCounter------*/
var TimeCounter = function() {
	this.milisecond = 0;
	this.second     = 0;
	this.minute     = 0;
}

TimeCounter.prototype.updateTime = function(gameSpeed) {
	this.milisecond = this.milisecond + gameSpeed;
	if ( this.milisecond >= 1000) {
		this.second--;
		this.milisecond = 0;
		if (this.second <= 0) {
			this.minute--;
			if (this.minute < 0) {
				this.minute = 0;
				this.second = 0;
			} else {
				this.second = 59;
			}
		}
	}

	return this.minute + ':' + this.second;
}

TimeCounter.prototype.isTimeOver = function() {
	return ((this.minute == 0) && (this.second == 0)) ? true : false;
}

TimeCounter.prototype.initialize = function(minute, second) {
	this.minute = minute;
	this.second = second;
}

TimeCounter.prototype.getMinute = function() {
	return this.minute;
}

TimeCounter.prototype.getSecond = function() {
	return this.second;
}

/*-------------------*/

/*-------Score-------*/
var Score = function() {
	this.homeScore =  0;
	this.awayScore =  0;
}

Score.prototype.show = function(el) {
	el.html(this.getScore());
}

Score.prototype.setHomeScore = function(v) {
	this.homeScore = v;
}

Score.prototype.getHomeScore = function() {
	return this.homeScore;
}

Score.prototype.setAwayScore = function(v) {
	this.awayScore = v;
}

Score.prototype.getAwayScore = function() {
	return this.awayScore;
}

Score.prototype.getScore = function() {
	return this.homeScore + ' - ' + this.awayScore;
}
/*---------------------*/

/*------GameState------*/

var GameState = function() {
	this.WAIT        = 'WAIT';
	this.IN_GAME     = 'IN_GAME';
	this.END_GAME    = 'END_GAME';
	this.code        =  '';
	this.description =  '';
}

GameState.prototype.setCode = function(v) {
	this.code = v;
}

GameState.prototype.getCode = function() {
	return this.code;
}

GameState.prototype.setDescription = function(v) {
	this.description = v;
}

GameState.prototype.getDescription = function() {
	return this.description;
}
/*---------------------*/

/*------Pong------*/
function Pong(socket) {
	//BEGIN LIBRARY CODE
	var x;
	var y;
	var dx;
	var dy;
	var WIDTH;
	var HEIGHT;
	var ctx;
	var paddlex;
	var paddleY;
	var paddleHt;
	var paddleWt;
	var intervalId;
	var rightDown = false;
	var leftDown = false;
	var radius;
	var paddlexAI;
	var gameController = {
		velocityY: 0,
		sensitivity: 0.05,
		gameSpeed: 14 //13
	};
	
	var canvas = document.getElementById('pongCanvas');

	var score;
	var state;
	var timeCounter;
	var timerId;
	var minute;
	var second;
	var minuteLength = 1;
	var secondLength = 0;
	var countDownNum = 3;
	var playerWidth = 48;	

	///////////////////////////////
	// the image to be clipped inside the ball
	var imgIndex = 1;
	var imgBall1 = new Image();
	imgBall1.onload = initGame;
	imgBall1.src = "/presentations/pong/screen/images/ball1.png";

	var imgBall2 = new Image();
	imgBall2.onload = initGame;
	imgBall2.src = "/presentations/pong/screen/images/ball2.png";

	var paddleHome = new Image();
	paddleHome.onload = initGame;
	paddleHome.src = "/presentations/pong/screen/images/playerHome.png";

	var paddleAway = new Image();
	paddleAway.onload = initGame;
	paddleAway.src = "/presentations/pong/screen/images/playerAway.png";

	var showTimer = function(timerElement, notifyElement, timeCounter) {
		//var timeLeft = timeCounter.updateTime(gameController.gameSpeed);
		var timeLeft = timeCounter.updateTime(1000);
		timerElement.html(timeLeft);
	}

	var showScores = function(homeElement, awayElement, homeScore, awayScore) {
		homeElement.html(homeScore);
		awayElement.html(awayScore);
	}

	var setWait = function() {
		state.setCode(state.WAIT);
		state.setDescription('wait');
	}

	var isWait = function() {
		return (state.getCode() === state.WAIT) ? true : false;
	}

	var setInGame = function() {
		state.setCode(state.IN_GAME);
		state.setDescription('in game');
	}

	var isInGame = function() {
		return (state.getCode() === state.IN_GAME) ? true : false;
	}	

	var setEndGame = function() {
		state.setCode(state.END_GAME);
		state.setDescription('end game');
	}

	var isEndGame = function() {
		return (state.getCode() === state.END_GAME) ? true : false;
	}

	var getHomeScore = function() {
		return score.getHomeScore();
	}

	var getAwayScore = function() {
		return score.getAwayScore();
	}

/*
	function onKeyEventChange(change) {
		return function (evt) {
			switch (evt.keyCode) {
				// Left/Right
				case 37: leftDown = change; break;
				case 39: rightDown = change; break;
				// Up/Down
				case 38: leftDown = change; break;
				case 40: rightDown = change; break;
			}
		};
	}
	$(document).keydown(onKeyEventChange(true));
	$(document).keyup(onKeyEventChange(false));
*/

	function setLeftDown(change) {
		leftDown = change;
	}

	function setRightDown(change) {
		rightDown = change;
	}

	function initPaddles(callback) {
		paddlex = WIDTH / 2;
		paddlexAI = paddlex;
		paddleHt = 10;
		paddleWt = 75;
		gameController.velocityY = 0;
		callback();
	}

	function initGame() {
		ctx = canvas.getContext('2d');
		WIDTH = canvas.width;
		HEIGHT = canvas.height;
		x = 150;
		y = 150 + 3*playerWidth;
		dx = 2;
		dy = 4;
		radius = 10;
		rightDown = false;
		leftDown = false;

		score = new Score();
		state = new GameState();
		timeCounter = new TimeCounter();
		timeCounter.initialize(minuteLength, secondLength);
		setWait();
	}

	function startGame() {
		$('#timer').html('1:00');
		$('#notify').html('');
		score.setHomeScore(0);
		score.setAwayScore(0);
		showScores($('#scoreHome'), $('#scoreAway'), score.getHomeScore(), score.getAwayScore());

		var countDownInterval = 0;

		var countDownInterval = setInterval(function() {
			if (countDownNum <= 0) {
				countDownNum = 3;
				$('#notify').html('');
			} else {
				countDownNum = countDownNum - 1;
				$('#notify').html('  ' + countDownNum + '  ');
			}
		},1000);

		setTimeout(function() {
			clearInterval(countDownInterval);
			$('#notify').html('');
			setInGame();
			kickOff();
		},3000);
	}

	function kickOff() {
		//gameController.gameSpeed = 18;
		intervalId = 0;
		initPaddles(function() {
			/*
			if (gameController.gameSpeed >= 18) {
				clearInterval(intervalId);
				intervalId = setInterval(checkSpeedAndDraw, gameController.gameSpeed);				
			}
			*/

			clearInterval(intervalId);
			intervalId = setInterval(draw, gameController.gameSpeed);

			clearInterval(timerId);
			timerId = setInterval(function() {
				showTimer($('#timer'), $('#notify'), timeCounter);
				/*
				if (timeCounter.second < 40) {
					gameController.gameSpeed = 13;
				}
				*/
			}, 1000);
		});
	}

	function drawBall(x,y,r) {
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI*2, true);
		ctx.closePath();
		if (imgIndex === 1) {
			ctx.drawImage(imgBall1, x-r, y-r, 2*r, 2*r);	
			imgIndex = 2;
		} else {
			ctx.drawImage(imgBall2, x-r, y-r, 2*r, 2*r);	
			imgIndex = 1;
		}
	}

	function rectHome(x,y,w,h) {
		ctx.beginPath();
		ctx.rect(x,y-playerWidth+(h/2),w,h);
		ctx.closePath();
		//ctx.fill();
		ctx.drawImage(paddleHome, x, y-playerWidth+(h/2), w, h+playerWidth-(h/2));
	}

	function rectAway(x,y,w,h) {
		ctx.beginPath();
		ctx.rect(x,y+playerWidth-5,w,h);
		ctx.closePath();
		//ctx.fill();
		ctx.drawImage(paddleAway, x, y, w, h+playerWidth-(h/2));
	}

	function clear() {
		ctx.clearRect(0, 0, WIDTH, HEIGHT);
	}

	function followBallAI() {

		//randomly pick number beteween 0 and 1
		var delayReaction = Math.random();
		
		//25% chance of reaction delay
		//if(delayReaction >= 0.25) {
		//if(delayReaction >= 0.40) {
		if(delayReaction >= 0.37) {

			if(x > paddlexAI + paddleWt) {
				if(paddlexAI + paddleWt + 5 <= WIDTH) {
					paddlexAI += 5;
				}
			}
			
			else if(x < paddlexAI) {
				if(paddlexAI - 5 >= 0) {
					paddlexAI -= 5;
				}
			}
			
			else {

				var centerPaddle = Math.random();

				//80% chance of better centering the paddle
				//otherwise the paddleAI will most of the times
				//hit the ball in one of its extremities
				//if(centerPaddle > 0.2) {
				if(centerPaddle > 0.3) {
					//if ball closer to left side of computer paddle
					if( Math.abs(x - paddlexAI) < Math.abs(x - paddlexAI - paddleWt) ) {
						if(paddlexAI - 5 >= 0) {
							paddlexAI -= 5;
						}
					}
					else {
						if(paddlexAI + paddleWt + 5 <= WIDTH) {
							paddlexAI += 5;
						}
					}
				}
			}
		}
	}
	
	function notify(msg) {
		$('#notify').html(msg).fadeIn(200).delay(500).fadeOut(200);
	}
	
	//END LIBRARY CODE

	function checkSpeedAndDraw() {
		if (gameController.gameSpeed < 18) {
			clearInterval(intervalId);
			intervalId = setInterval(draw, gameController.gameSpeed);
		} else {
			draw();	
		}
	}

	function draw() {
		clear();
		drawBall(x, y, radius);

		//move the paddle if left or right is currently pressed
		if (rightDown) {
			paddlex += 5;
		} else if (leftDown) {
			paddlex -= 5;
		}

		paddlex += gameController.velocityY * gameController.sensitivity;
		paddlex = Math.min(WIDTH - paddleWt, paddlex);
		paddlex = Math.max(0, paddlex);
		
		followBallAI();
		
		rectHome(paddlex, HEIGHT-paddleHt, paddleWt, paddleHt);
		rectAway(paddlexAI, 0, paddleWt, paddleHt);

		if (x + dx + radius > WIDTH || x + dx - radius < 0) {
			dx = -dx;
		}

		//upper lane
		if (y + dy - radius - playerWidth <= 0) {

			if (x <= paddlexAI || x >= paddlexAI + paddleWt) {
				score.setHomeScore(score.getHomeScore() + 1);
				showScores($('#scoreHome'), $('#scoreAway'), score.getHomeScore(), score.getAwayScore());
				x = 150;
				y = 150 + 3*playerWidth;
				dx = 2;
				dy = 4;
			}

			else {
				dy = -dy;
			}
		}
		
		//lower lane
		//else if (y + dy + radius + playerWidth > HEIGHT) {
		else if (y + dy + 2*radius + playerWidth-paddleHt > HEIGHT) {
			if (x > paddlex && x < paddlex + paddleWt) {
				dx = 8 * ((x-(paddlex+paddleWt/2))/paddleWt);
				dy = -dy;
			}
			else {
				score.setAwayScore(score.getAwayScore() + 1);
				showScores($('#scoreHome'), $('#scoreAway'), score.getHomeScore(), score.getAwayScore());
				x = 150;
				y = 150 + 3*playerWidth;
				dx = 2;
				dy = -4;
			}
		}

		if (timeCounter.isTimeOver()) {
			if ((timeCounter.getMinute() === 0) && (timeCounter.getSecond() === 0)) {
				if (score.getHomeScore() > score.getAwayScore()) {
					$('#notify').html('Voitit');
				} else if (score.getHomeScore() < score.getAwayScore()) {
					$('#notify').html('Hävisit');
				} else {
					$('#notify').html('Tasapeli');
				}
				socket.emit('screen:gameOver', {'homescore': score.getHomeScore(), 'awayscore': score.getAwayScore()});
			}
			clearInterval(intervalId);
			clearInterval(timerId);
			setEndGame();
			initGame();
		}

		x += dx;
		y += dy;
	}

	return {
		initGame: initGame,
		startGame: startGame,
		setLeftDown: setLeftDown,
		setRightDown: setRightDown,
		getGameController: function() {
			return gameController;
		}
	};
}