var QrRemote = QrRemote || {};

QrRemote.initScreen = function (socket, elems, pong) {

	var initialized = false;
	
	var resetState = function() {
		console.log('Resetting state');
		socket.emit('screen:getQrcode', function (qrData) {
			elems.qr.qrCode('showData', qrData);
			elems.qr.qrCode('isVisible', true);
		});
	};

	var setDisconnected = function() {
		elems.qr.qrCode('updateStatus', 'disconnected');
		elems.qr.qrCode('isVisible', false);
	};
	
	socket.on('remote:action', function (action) {
		console.log('Signal - remote:action');
		switch (action.action) {
			case 'pong':
				elems.pong.qrPong('doAction', action.command);
				break;
			default:
				return;
		}
	});

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

	socket.on('control:action', function (data) {
		console.log(JSON.stringify(data));
		if (data) {
			var keyUpEvent   = jQuery.Event("keyup");
			if (data.action == 'keydown') {
				var keyDownEvent = jQuery.Event("keydown");
				switch (data.direction) {
					case 'up'   : keyDownEvent.which = 38; pong.setLeftDown(true); break;
					case 'down' : keyDownEvent.which = 40; pong.setRightDown(true); break;
				}
			} 

			if (data.action == 'keyup') {
				var keyUpEvent = jQuery.Event("keyup");
				switch (data.direction) {
					case 'up'   : keyUpEvent.which = 38; pong.setLeftDown(false); break;
					case 'down' : keyUpEvent.which = 40; pong.setRightDown(false);break;
				}
			}
		}
	});

	socket.on('remote:attached', function () {
		console.log('Signal - remote:attached');
		//elems.qr.qrCode('isVisible', false);
		$('.qr-code-token').html('&nbsp;');
		pong.initGame();
		pong.startGame();
	});
	
	socket.on('remote:exited', function () {
		window.location.href = '/screen/pong';
		console.log('Signal - remote:exited');
		resetState();
	});

	socket.on('remote:detached', function () {
		console.log('Signal - remote:detached');
		resetState();
	});

	socket.on('screen:reset', function () {
		window.location.reload();
	});
	
	socket.on('connect', function () {
		console.log('Signal - connect');
		if (initialized) {
			window.location.reload();
		}
		initialized = true;
		setDisconnected();
	});

	socket.on('connecting', function () {
		console.log('Signal - connecting');
		setDisconnected();
	});

	socket.on('disconnect', function () {
		console.log('Signal - disconnect');
		setDisconnected();
	});

	socket.emit('screen:ready', function () {
		resetState();
	});

};