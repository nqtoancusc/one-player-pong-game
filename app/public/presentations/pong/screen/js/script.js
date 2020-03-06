/* global io */
/* global QrRemote */
/* global Pong */
/* jshint -W064 */
var pong;
$(function() {
	var socket = io.connect(null, {
		'max reconnection attempts': 300,
		'reconnection limit': 3000
	});	
	pong = Pong(socket);
	var elems = {};
	elems.qr = $('#qr-remote').qrCode();
	elems.pong = $('#pongCanvas').qrPong({ pong: pong });
	QrRemote.initScreen(socket, elems, pong);
	pong.getGameController().sensitivity = 0.03;

	//$(document).keydown(pong.onKeyEventChange(true));
	//$(document).keyup(pong.onKeyEventChange(false));
});

function gameOver(homescore, awayscore) {
	if (socket) {
		socket.emit('screen:gameOver', {'homescore': homescore, 'awayscore': awayscore});
	}
}