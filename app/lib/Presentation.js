var _ = require('underscore')
	, randomtoken = require('./util/RandomToken')
	, DEFAULT_TOKEN_LENGTH = 3
	, winston = require('winston')
	;

var isPositiveNumberOrThrow = function(num) {
	if (!_.isNumber(num) || num < 1) {
		throw new Error('Invalid number: ' + num);
	}
};
var isNonEmptyStringOrThrow = function(str) {
	if (!_.isString(str) || !str.length) {
		throw new Error('Invalid string parameter, expecting non-empty string: ' + str);
	}
};
var isValidComponentString = function(componentStr) {
	isNonEmptyStringOrThrow(componentStr);
	if (!componentStr.match(/remote|screen/)) {
		throw new Error('Invalid component string: ' + componentStr);
	}
};

var Presentation = function(params) {
	if (params) {
		this.setScreenToken(params.token);
		this.setScheme(params.scheme);
		this.generateRemoteToken();
	}
};

_.extend(Presentation.prototype, {
	
	tokenLength: DEFAULT_TOKEN_LENGTH,
	
	scheme: '',

	getScheme: function() {
		return this.scheme;
	},
	
	setScheme: function(scheme) {
		isNonEmptyStringOrThrow(scheme);
		this.scheme = scheme;
		return this;
	},
	
	setRemoteTokenLength: function(newLength) {
		isPositiveNumberOrThrow(newLength);
		Presentation.prototype.tokenLength = newLength;
		return this;
	},
	
	getScreenToken: function() {
		return this._screenToken;
	},
	
	setScreenToken: function(token) {
		isNonEmptyStringOrThrow(token);
		this._screenToken = token;
		return this;
	},
	
	getRemoteToken: function() {
		if (!this._remoteToken) {
			this.generateRemoteToken();
		}
		return this._remoteToken;
	},
	
	generateRemoteToken: function() {
		var oldToken = this._remoteToken;
		while (oldToken === this._remoteToken) {
			// TODO: verify uniqueness in presentation controller
			winston.info('...generating new token...');
			this._remoteToken = randomtoken.get(this.tokenLength);
		}
	},
	
	canBeDeleted: function() {
		return this.type === 'custom';
	},
	
	getPresentationStatus: function() {
		return _.extend(
		{
			presentationPath: '/screen/' + this.getScreenToken(),
			tokenPath		: '/' + this.getRemoteToken(),
			token			: this.getRemoteToken()
		},
		this.getComponentsStatus());
	},
	
	hasRemoteAttached: function() {
		return !!this._remote;
	},
	
	hasScreenAttached: function() {
		return !!this._screen;
	},

	hasRemoteEnabled: function() {
		return this.remoteEnabled;
	},
	
	getComponentsStatus: function() {
		return {
			screenAttached: this.hasScreenAttached(),
			remoteAttached: this.hasRemoteAttached()
		};
	},
	
	getComponent: function(componentStr) {
		isValidComponentString(componentStr);
		return this['_' + componentStr];
	},
	
	setComponent: function(componentStr, componentObj) {
		isValidComponentString(componentStr);
		componentObj.setScheme(this.getScheme());
		this['_' + componentStr] = componentObj;
		return this;
	},
	
	unset: function(componentStr) {
		isValidComponentString(componentStr);
		this['_' + componentStr] = null;
		return this;
	}
});

module.exports = Presentation;
