(function($) {
		
	var _element = null;
	
	var _qrCodeWrapper = null;
	var _qrCodeInUse = null;
	var _qrCode = null;
	
	var _setVisible = function(visible) {
		_qrCodeWrapper.slideUp(500, function() {
			_qrCode.toggle(visible);
			_qrCodeInUse.toggle(!visible);
			_qrCodeWrapper.slideDown(500);
		});
	};
	
	var _showData = function(data) {
		if (data) {
			$.each(data, function(key, val) {
				_get('.qr-code-' + key).html(val);
			});
			_updateStatus('connected');
		} else {
			_updateStatus('error');
		}
	};
	
	var _updateStatus = function(newStatus) {
		console.log('new status: ' + newStatus);
		_get('.status').css('display', 'none');
		_get('.status.' + newStatus).css('display', 'inline');
	};
	
	var _get = function(selector) {
		return _element.find(selector);
	};
	
	$.widget('qrremote.qrCode', {
		options: {
			className: '',
			lang: 'en_US'
		},
		isVisible		: _setVisible,
		showData		: _showData,
		updateStatus	: _updateStatus,
		_create: function() {
			_element = this.element;
			_qrCodeWrapper	= _get('.qr-code-wrapper');
			_qrCodeInUse	= _get('.qr-code-inuse');
			_qrCode			= _get('.qr-code');
		}
	});
	
})(jQuery);