var Uuid = require('../models/Uuid')
	, Session = require('../models/Session')
	, Log = require('../models/Log')
	;

var write = function(req, eventGroup, eventType, data) {

	if (!data || !!process.env.SKIP_LOGGING) {
		return;
	}

	req = req || {};
	var clientInfo = {
		token		: req.sessionID || null,
		userAgent	: req.headers && req.headers['user-agent'] || null,
		remoteIp	: req.connection && req.connection.remoteAddress || null
	};
	
	var logEntry = {
		eventGroup	: eventGroup,
		eventType	: eventType,
		data		: data || ''
	};
	
	if (!(req.cookies && req.cookies.uuid)) {
		Log.create(logEntry);
		return;
	}

	try {
		var uuidParams = { uuid: req.cookies.uuid };
		Uuid
			.findOrCreate(uuidParams, uuidParams)
			.success(function(uuid) {
				if (!(uuid && uuid.id && clientInfo.token)) {
					console.log('Cannot write session record');
					Log.create(logEntry);
				} else {
					Session
						.findOrCreate({ token: clientInfo.token }, clientInfo)
						.success(function(session) {
							uuid.addSession(session)
								.success(function() {
									Log
										.create(logEntry)
										.success(function(log) {
											session.addLog(log);
										});
								});
						})
						.failure(function(error) {
							console.log('Caught failure clientInfo.token:');
							console.log(error);
						});
				}
			})
			.failure(function(error) {
				console.log('Caught failure uuidParams:');
				console.log(error);
			});
	} catch (e) {
		console.log('Caught error: ' + e);
	}
};

module.exports = {
	
	/**
	 * Writing methods
	 */
	custom: {
		write: write
	},
	
	screen: {
		requested:	function(req) {
			write(req, 'screen', 'request', req.url);
		},
		loading: function(req, msg) {
			write(req, 'screen', 'loading', msg);
		},
		ready: function(req, pid) {
			write(req, 'screen', 'ready', pid);
		},
		detach: function(req, pid) {
			write(req, 'screen', 'detach', pid);
		}
	},
	remote: {
		requested: function(req) {
			write(req, 'remote', 'request', req.url);
		},
		origin: function(req) {
			if (!req || !req.cookies) {
				return;
			}
			var o = 'UNKNOWN';
			switch (req.cookies.origin) {
				case 'n': o = 'NFC'; break;
				case 'q': o = 'QR-CODE'; break;
				case 'f': o = 'FORM'; break;
				default: break;
			}
			write(req, 'remote', 'origin', o);
		},
		direct: function(req) {
			write(req, 'remote', 'direct', req.url);
		},
		ready: function(req, pid) {
			write(req, 'remote', 'ready', pid);
		},
		exit: function(req, pid) {
			write(req, 'remote', 'exit', pid);
		},
		detach: function(req, pid) {
			write(req, 'remote', 'detached', pid);
		},
		timerExpiredExclusive: function(req) {
			write(req, 'remote', 'timer expire', 'exclusive');
		},
		timerExpiredDisconnect: function(req) {
			write(req, 'remote', 'timer expire', 'disconnect');
		},
		action: function(req, pid, data) {
			data = data || {};
			if (data.command) {
				write(req, 'remote', 'command', JSON.stringify(data.command));
			}
		}
	},
	connection: {
		disconnect: function(req, type) {
			write(req, 'connection', 'disconnect', type || 'unknown');
		}
	},
	form: {
		requested: function(req) {
			write(req, 'form', 'request', req.url);
		},
		validationSuccess: function(req) {
			write(req, 'form', 'validation', 'success');
		},
		validationError: function(req, error) {
			write(req, 'form', 'validation error', error);
		},
		sentSuccess: function(req) {
			write(req, 'form', 'send', 'success');
		},
		sentFail: function(req, error) {
			write(req, 'form', 'send error', error);
		}
	},
	system: {
		ready: function(info) {
			write(null, 'server', 'started', info);
		}
	}
};
