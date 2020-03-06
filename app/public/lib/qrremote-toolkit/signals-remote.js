/* global Hammer */
/* jshint -W064 */

var QrRemote = QrRemote || {};

QrRemote = {
	
	socket: null,
	
	init: function(socket) {
		var that = this;
		this.disconnected = false;
		this.socket = socket;
		this.controls.init($('#controls').find('.action-elem'), this);
		this.status.init('#status');
		this.controls.disable();

		socket.on('disconnect', function() {
			console.log('Signal - disconnect');
			that.controls.disconnect();
		});
		
		socket.on('remote:attached', function() {
			console.log('Signal - remote:attached');
			that.controls.disconnect();
		});
		
		socket.on('screen:detached', function() {
			console.log('Signal - screen:detached');
			that.controls.disconnect();
		});
		
		socket.on('screen:gameOver', function() {
			console.log('Signal - screen:gameOver');
			window.location.href = '/';
		});

		var actionHandler = function() {

			var button		= $(this);
			var buttonGroup = button.parents('.controls-group');
			
			button.addClass('selected');
			
			var beforesend = button.data('beforesend');
			if (beforesend) {
				if (that.callbacks[beforesend](button) === false) {
					that.controls.enable();
					return false;
				}
			}
			
			var signal = button.data('signal') || 'remote:action';
			var sub = button.data('subaction');
			var val = button.data('val');
			// Use .val() if data('val') is undefined
			val = typeof val === 'undefined' ? button.val() : val;
			// Cast to string
			val = '' + val;

			var command = {};
			command[sub] = val;

			if (!that.disconnected) {
				socket.emit(signal, {
					panel: that.controls.currentMain,
					action: buttonGroup.data('action'),
					command: command
				}, function(data) {
					if (data) {
						var aftersend = button.data('aftersend');
						if (aftersend) {
							that.callbacks[aftersend](button);
						}
					} else {
						that.status.update('error');
					}
				});
			}
			return sub === 'exit';
		};

		this.controls.container.filter('.click-trigger')
				.on('click', actionHandler);

		if (typeof Hammer !== 'undefined') {
			var	lastDragEventTime = 0,
				throttleMillis = 200,
				batSurface = $('#bat-surface'),
				options = {
					prevent_default: true
				};
			Hammer(batSurface, options)
				.on('touchend drag swipe', function(ev) {
					var gesture,
						velocityY;

					if (ev.type.match('swipe')) {
						return;
					}

					if (ev.type.match('touch')) {
						velocityY = 0;
					} else {
						gesture = ev.gesture;
						if (lastDragEventTime > (gesture.timeStamp - throttleMillis)) {
							return;
						}
						lastDragEventTime = gesture.timeStamp;
						velocityY = Math.round(gesture.deltaY);
						console.log(gesture);
					}
					batSurface.data('val', velocityY);
					actionHandler.call(batSurface);

					// Update remote paddle coordinates
					if (ev.gesture) {
						var batY = ev.gesture.touches[0].pageY - 208;
						console.log(batY);
						if (batY > (516 - 100)) {
							batY = 516 - 100;
						}
						if (batY < 0) {
							batY = 0;
						}
						bat.style.top  = batY + 'px';						
					}
				});
		}

		
		socket.emit('remote:ready', function(data) {
			if (data.screenAttached && !data.remoteAttached) {
				that.controls.enable();
			} else {
				that.controls.disconnect();
			}
		});
	},
	
	controls: {
		
		container: null,
		
		currentMain: null,
		
		init: function(jqSelector, context) {
			this.container = $(jqSelector);
			this.context = context;
			this.currentMain = this.container.first().data('command');
		},
		enable: function() {
			console.log('Controls - enable');
			this.container.removeClass('selected');
			$('[data-command=' + this.currentMain + ']').addClass('selected');
			this.context.status.update('ready');
		},
		disable: function() {
			console.log('Controls - disable');
			this.container.removeClass('selected');
			this.context.status.update('wait');
		},
		disconnect: function() {
			console.log('Controls - disconnect');
			this.container.removeClass('selected');
			this.context.status.update('disconnected');
			this.context.socket.disconnect();
			this.context.disconnected = true;
		}
	},
	
	status: {

		elems: null,
		
		init: function(jqSelector) {
			this.elems = $(jqSelector).find('.status');
		},
		update: function(newState) {
			console.log('new state: (' + newState + ')');
			this.elems.css('display', 'none')
					.filter('.' + newState).css('display', 'inline-block');
		}
	}
};
