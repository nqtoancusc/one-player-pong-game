var winston = require('winston')
	, logger = require('./util/Logger')
	, QrCode = require('./util/QrCode')
	, presentationCtrl = require('./PresentationController')
	, Screen = require('./components/Screen')
	, Remote = require('./components/Remote')
	, playerCtrl = require('./PlayerController')
	;

function Signals() {

	this.setup = function(app) {
		
		/**
		 * Returns presentation object based on the request referer
		 * For example:
		 * Screen: .../screen/[presentationId]	--> direct
		 * Remote: .../[token]					--> resolve by token
		 **/
		var getPresentationByReferer = function(component, referer) {
			var pathEnd = referer.split('?').shift().split('/').pop();
			if (component === 'screen') {
				return presentationCtrl.getByScreenToken(pathEnd);
			}
			return presentationCtrl.getByRemoteToken(pathEnd);
		};
		
		var setupRemoteTimers = function(remote, presentation, req) {
			remote.setTimerForExclusiveControl(function() {
				winston.info('ExclusiveControl timer: expired');
				if (!presentation || !req) {
					// When this timeouts, presentation may not exist anymore
					winston.info('ExclusiveControl timer: no presentation or request');
					return;
				}

				if (presentation.getRemoteToken() !== remote.getRemoteToken()) {
					// Ignore timer if it is no longer relevant
					winston.info('ExclusiveControl timer: no longer relevant');
					return;
				}

				presentation.unset('remote');
				presentation.generateRemoteToken();
				winston.info('ExclusiveControl timer: room: ' + presentation.getScreenToken());
				req.io.room(presentation.getScreenToken()).broadcast('remote:detached');
				logger.remote.timerExpiredExclusive(req);
			});
			remote.setTimerForForcedDisconnect(function() {
				winston.info('ForcedDisconnect timer');
				if (req) {
					req.io.emit('screen:detached');
					logger.remote.timerExpiredDisconnect(req);
				}
			});
		};

		// Shared handlers for Screen and Remote signals
		var componentHandlers = {
			ready: function(component, ComponentType) {
				return function(req) {
					// Resolve presentation
					var presentation = getPresentationByReferer(component, req.headers.referer);
					if (!presentation) {
						winston.info('Unknown presentation for component: (' + component + ')');
						req.io.respond(false);
						return;
					} else {
						winston.info('Presentation for component: (' + component + ')');
					}
					
					// Construct response and clientData -objects
					var token = presentation.getScreenToken();
					var remoteToken = presentation.getRemoteToken();
					var response = presentation.getComponentsStatus();
					var clientData = {
						type: component,
						host: req.headers.host,
						token: token,
						remoteToken: remoteToken
					};
					
					var attachedComponent = presentation.getComponent(component);
					if (component === 'remote' && attachedComponent && !attachedComponent.timedOut) {
						// If there is a screen component attached, rejoin
						winston.info('Component already attached (' + component + ') token (' + token + ')');
						req.io.join(token);
						req.io.respond(response);
					} else {
						// Else set up the new component
						var newComponent = new ComponentType();
						if (component === 'remote') {
							setupRemoteTimers(newComponent, presentation, req);
							newComponent.setRemoteToken(remoteToken);
						}
						presentation.setComponent(component, newComponent);
						req.io.join(token);
						req.io.room(token).broadcast(component + ':attached');
						req.io.socket.set('clientData', clientData, function() {
							req.io.respond(response);
						});
						winston.info('New component set up: ' + JSON.stringify(clientData));
						winston.info('Remote token: ' + presentation.getRemoteToken());
						logger[component].ready(req, 'presentation: ' + token + ', token: ' + remoteToken);
					}
				};
			},
			exit: function(component) {
				return function(req) {
					req.io.socket.get('clientData', function(err, clientData) {
						if (component === 'remote') {
							if (!clientData || !clientData.token) {
								return;
							}
							req.io.room(clientData.token).broadcast(component + ':exited');
							winston.info(component + ':exited (token: ' + clientData.token + ')');
							logger.remote.exit(req, clientData.token);
						}
					});
				};
			},
			detach: function(component) {
				return function(req) {
					req.io.socket.get('clientData', function(err, clientData) {
						if (!clientData || !clientData.token) {
							return;
						}
						req.io.room(clientData.token).broadcast(component + ':detached');
						winston.info(component + ':detached (token: ' + clientData.token + ')');
						logger[component].detach(req, clientData.token);
					});
				};
			}
		};
	
		app.io.route('screen', {
			ready:			componentHandlers.ready('screen', Screen),
			detached:		componentHandlers.detach('screen'),
			getQrcode:	function(req) {
				req.io.socket.get('clientData', function(err, clientData) {
					if (!clientData || !clientData.token) {
						return;
					}
					var presentation = presentationCtrl.getByScreenToken(clientData.token);
					var token = presentation.getRemoteToken();
					var remoteUrl = 'http://' + clientData.host + '/' + token + '?o=q';
					req.io.respond({
						img: (new QrCode()).getQrCode(remoteUrl),
						url: clientData.host,
						token: token
					});
				});
			},
			gameOver:	function(req) {
				req.io.socket.get('clientData', function(err, clientData) {
					if (req.data.homescore && req.data.awayscore) {
						//var presentation = presentationCtrl.getByScreenToken(clientData.token);
						//var token = presentation.getRemoteToken();
						winston.info('game over');
						req.io.room(clientData.token).broadcast('screen:gameOver');
						playerCtrl.updateScores(req.data.homescore, req.data.awayscore);
						//setTimeout(function () {
							
						//}, 2000);
					}
				});
			}
		});
		
		app.io.route('remote', {
			ready:			componentHandlers.ready('remote', Remote),
			exit:			componentHandlers.exit('remote', Remote),
			detached:		componentHandlers.detach('remote'),
			action:		function(req) {
				req.io.socket.get('clientData', function(err, clientData) {
					if (!clientData || !clientData.token) {
						return;
					}
					req.io.room(clientData.token).broadcast('remote:action', req.data);
					req.io.respond(true);
					winston.info('remote:action (token: ' + clientData.token + '): ' + JSON.stringify(req.data));
					logger.remote.action(req, clientData.token, req.data);
				});
			},
			email: function(req) {
				winston.info('got email request: ' + req.data.command);
			},
			control: function(req) {
				req.io.socket.get('clientData', function(err, clientData) {
					req.io.room(clientData.token).broadcast('control:action', req.data);
					winston.info('control:action ==> clientData.token:' + clientData.token);
					winston.info('control:action ' + JSON.stringify(req.data));
				});
			}
		});
		
		app.io.route('disconnect', function(req) {
			req.io.socket.get('clientData', function(err, clientData) {
				var type, presentation;
				if (!clientData || !clientData.type || !clientData.token ||
					!clientData.type.match(/screen|remote/)) {
					winston.info('Socket disconnected');
				} else {
					type = clientData.type;
					presentation = presentationCtrl.getByScreenToken(clientData.token);
					if (presentation) {
						if (presentation.getRemoteToken() === clientData.remoteToken) {
							presentation.unset('remote');
							presentation.generateRemoteToken();
							req.io.route(type + ':detached');
						}
					}
					winston.info('Socket disconnected (type: ' + type + ')');
				}
				logger.connection.disconnect(req, type);
			});
		});
		
	};
}

module.exports = new Signals();