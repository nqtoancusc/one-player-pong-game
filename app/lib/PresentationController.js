var _ = require('underscore')
	, winston = require('winston')
	, Presentation = require('./Presentation')
	;

function PresentationController() {
	
	/**
	 * Collection of Presentation objects
	 */
	var _presentations = {};

	var _defaultScheme;
	
	/**
	 * Loads up the presentations with initial data
	 */
	this.init = function(presentationsConfig) {
		var presentations = {};
		
		if (!presentationsConfig || !presentationsConfig.presentations ||
				!presentationsConfig.presentations.length) {
			winston.error('No presentations in the config file!');
			return false;
		}
		
		_.each(presentationsConfig.presentations, function(p) {
			var newPresentation = new Presentation(p);
			var token = newPresentation.getScreenToken();
			if (presentations[token]) {
				throw new Error('Duplicate token: ' + JSON.stringify(p));
			}
			presentations[token] = newPresentation;
		});

		_defaultScheme = presentationsConfig.defaultScheme ?
				presentationsConfig.defaultScheme : presentations[0].getScheme();
		
		_presentations = presentations;
	};
	
	this.getByRemoteToken = function(token) {
		return _.findWhere(_presentations, { _remoteToken: token }) || null;
	};
	
	this.getByScreenToken = function(token) {
		return _presentations[token] || null;
	};

	this.getDefaultScheme = function() {
		return _defaultScheme;
	};
	
	this.length = function() {
		return _.size(_presentations);
	};
}

module.exports = new PresentationController();
