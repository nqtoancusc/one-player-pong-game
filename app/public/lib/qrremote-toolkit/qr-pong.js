(function($) {
	
	var _elem = null;
	
	var doAction = function(action) {
		action = action || {};
		if (typeof action.drag !== 'undefined') {
			var velocityY = parseInt(action.drag);
			velocityY = $.isNumeric(velocityY) ? velocityY : 0;
			this.options.pong.getGameController().velocityY = action.drag;
		}
		return;
	};
	
	$.widget('qrremote.qrPong', {
		options: {
			pong: null,
			className: ''
		},
		_create: function() {
			_elem = $(this.element);
		},
		doAction: doAction
	});
	
})(jQuery);