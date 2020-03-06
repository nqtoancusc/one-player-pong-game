/* global io */
/* global QrRemote */
$(function() {
	if (typeof io !== 'undefined') {
		var socket = io.connect(null, {
			'reconnect': false
		});
		QrRemote.init(socket);
	}

	$.each(['Up', 'Down'], function() {
		var actionString = this.toLowerCase();
		$('#btn' + this).bind('mousedown touchstart', function(ev) {
			var actions = ['Up', 'Down'];
			var k = 0;
			for (k = 0; k < actions.length; k++) {
				if (actions[k] != this) {
					$('#btn' + actions[k]).trigger('mouseup');
				}
			}

			ev.preventDefault();
			socket.emit('remote:control', {action: 'keydown', direction: actionString});	
		});

		$('#btn' + this).bind('mouseup touchend', function(ev) {
			ev.preventDefault();
			socket.emit('remote:control', {action: 'keyup', direction: actionString});
		});
	});
	//$('body').on("touchend drag swipe",function(e){ e.preventDefault ? e.preventDefault() : event.returnValue = false; });
});