var _ = require('underscore')
	, winston = require('winston')
	, Component = require('../Component')
	, serverConfig = require('../../serverConfig')
	;

function Remote() {
	
	/**
	 * Timer for controlling the presentation exclusively.
	 * When it timeouts, other clients may seize control in turn.
	 * 
	 * Default time: 5 minutes or so
	 */
	this.timerExclusive = null;
	
	/**
	 * Timer after which client will be forcefully disconnected.
	 * 
	 * Default: 30 minutes or so
	 */
	this.timerDisconnect = null;
	
	this.timedOut = undefined;

	this.remoteToken = null;

}
_.extend(Remote.prototype, Component.prototype, {
	
	exclusiveTimeout: 1000 * serverConfig.remoteTimerExclusive,
	disconnectTimeout: 1000 * serverConfig.remoteTimerDisconnect,

	componentName: 'remote',
	file: 'remote.html',

	getRemoteToken: function() {
		return this.remoteToken;
	},

	setRemoteToken: function(token) {
		this.remoteToken = token;
	},
	
	setTimerForExclusiveControl: function(callback) {
		winston.info('Exclusive timer: ' + this.timerExclusive);
		this.timerExclusive = setTimeout(function() {
			this.timedOut = true;
			callback();
		}, this.exclusiveTimeout);
		winston.info('Exclusive timer starting ' + this.exclusiveTimeout + ' ms');
	},
	
	unsetTimerForExclusiveControl: function() {
		if (this.timerExclusive) {
			winston.info('Exclusive timer cleared');
			clearTimeout(this.timerExclusive);
			this.timerExclusive = null;
		} else {
			winston.info('Exclusive timer not found');
		}
	},
	
	setTimerForForcedDisconnect: function(callback) {
		this.timerDisconnect = setTimeout(function() {
			callback();
		}, this.disconnectTimeout);
		winston.info('Forced disconnect timer starting ' + this.disconnectTimeout + ' ms');
	},
	
	unsetTimerForForcedDisconnect: function() {
		if (this.timerDisconnect) {
			clearTimeout(this.timerDisconnect);
			this.timerDisconnect = null;
			winston.info('ForcedDisconnect timer cleared');
		} else {
			winston.info('ForcedDisconnect timer not found');
		}
	},
	
	unsetTimers: function() {
		this.unsetTimerForExclusiveControl();
		this.unsetTimerForForcedDisconnect();
	},

	getPostVals: function() {
		var postVals = {
			postVals: this.postVals || {}
		};
		if (serverConfig.isDev) {
			postVals.postVals = serverConfig.formDataDebug;
		}
		return postVals;
	}

});

module.exports = Remote;