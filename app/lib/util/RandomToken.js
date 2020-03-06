/**
 * Returns a token of given length
 * 
 * Example: (new RandomToken()).get(5)
 */
var RandomToken = function() {
	
	var chars		= 'abcdefghkmnpqrstuvwxyz23456789';
	var maxLen		= 32;
	
	var getRandomStr = function(len) {
		var out = '';
		for (var i = 0; i < len; i += 1) {
			out += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return out;
	};
	
	return {
		get: function(len) {
			return getRandomStr(this.validateLength(len));
		},
		
		validateLength: function(len) {
			var tryLen = parseInt(len);
			if (isNaN(tryLen) || tryLen < 1) {
				throw new Error('Invalid length, must be integer > 0, got: (' + len + ')');
			}
			return Math.min(tryLen, maxLen);
		},
		
		getMaxLength: function() {
			return maxLen;
		},
		
		setMaxLength: function(newLen) {
			// Do not use return value, only make sure newLen is int > 0
			this.validateLength(newLen);
			maxLen = newLen;
		}
	};
};

module.exports = new RandomToken();