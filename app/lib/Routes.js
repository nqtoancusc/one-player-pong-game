var winston = require('winston')
	, path = require('path')
	, express = require('express.io')
	, presentationCtrl = require('./PresentationController')
	, serverConfig = require('../serverConfig')
	, EnterCode = require('./components/EnterCode')
	, Screen = require('./components/Screen')
	, Remote = require('./components/Remote')
	, DashboardApi = require('./util/DashboardApi')
	, logger = require('./util/Logger')
	, randomtoken = require('./util/RandomToken')
	, swig = require('swig')
	, playerCtrl = require('./PlayerController')
	;

function Routes() {

	var app = null;

	// Middleware component 
	function manageUuidCookie(req, res, next) {
		if ((req && req.cookies && !!req.cookies.uuid) === false &&
			(res && !res.uuidWritten)) {
			// Cookie 'uuid' must NOT be found
			// And res.uuidWritten flag must NOT be set

			var uuid = randomtoken.get(32);
			res.cookie('uuid', uuid, { maxAge: 365 * 24 * 60 * 60 * 1000 });
			res.uuidWritten = true;
			req.cookies = req.cookies || {};
			req.cookies.uuid = uuid;
			winston.info('Cookie written, UUID: ' + uuid);
		}
		next();
	}

	function dropForwardSlash(req, res, next) {
		req.url = req.url.replace(/\/*$/, '');
		next();
	}

	function trackRemoteOrigin(req, res, next) {
		if ((req.query && req.query.o) &&
			(req.cookies && !req.cookies.origin)) {
			// If query param "o" exists, and cookie "origin" is NOT set
			// Write short lifespan cookie "origin"
			
			var origin = req.query.o;
			res.cookie('origin', origin, { maxAge: 60 * 1000 });
			req.cookies = req.cookies || {};
			req.cookies.origin = origin;
			winston.info('Cookie written, o: ' + origin);
		}
		next();
	}
	
	this.setup = function(appIn) {
		app = appIn;

		if (serverConfig.isDev) {
			swig.setDefaults({ cache: false });
		}

		app.engine('html', swig.renderFile);
		
		app.set('view cache', !serverConfig.isDev);
		app.set('view engine', 'html');
		app.set('views', serverConfig.requestBasePath);

		app.use(dropForwardSlash);
		app.use(manageUuidCookie);

		return this;
	};
	
	this.setupRoutesActive = function() {
		
		var renderComponent = function(req, res, presentation, component) {

			if (!presentation) {
				renderComponent(req, res, true, new EnterCode({ validationErrors: { code: 1 }}));
				return;
			}

			if (!component.getScheme()) {
				presentation = presentation || {};
				component.setScheme(presentation.scheme);
			}

			if (component.componentName === 'remote') {
				logger.remote.origin(req);
				res.cookie('origin', null, { maxAge: 0 });
			}

			component.render.call(component, req, res);
			winston.info('New component (' + component.componentName + ')');
		};
		
		app.get('/', trackRemoteOrigin, function(req, res) {
			if (req.query.code) {
				var code = req.query.code || '';
				if (typeof code === 'string') {
					code =  code.toLowerCase();
				}
				if (code.match(/^[a-z0-9]+$/) && code.length) {
					if (presentationCtrl.getByRemoteToken(code)) {
						var email = req.query.email;
						var name = req.query.name;
						var phone = req.query.phone;
						var firstanswer = req.query.question1 || '';
						var secondanswer = req.query.question2 || '';
						playerCtrl.add(email, name, phone, firstanswer, secondanswer);
					}
					res.redirect('/' + code);
					return;
				}
			}
			renderComponent(req, res, true, new EnterCode());
			logger.remote.requested(req);
		});
		
		app.get('/favicon.ico', function(req, res) {
			res.send(404, '');
		});

		app.get('/dashboard/*', function(req, res, next) {
			console.log('restricted access');
			next();
		});

		app.get(/^\/dashboard\/api\/(\w+)(?:\/(.+))?$/, DashboardApi.manage);

		app.get('/dashboard', function(req, res) {
			res.sendfile(serverConfig.requestBasePath + '/dashboard/index.html');
		});
		
		app.get('/screen/:token', function(req, res) {
			renderComponent(req, res, presentationCtrl.getByScreenToken(req.params.token), new Screen());
			logger.screen.requested(req);
		});

		app.get('/direct/:scheme', function(req, res) {
			var component = new Remote();
			if (!component.setScheme(req.params.scheme)) {
				component = new EnterCode();
			}
			component.render.call(component, req, res);
			logger.remote.direct(req);
		});
		
		app.get('/:token', trackRemoteOrigin, function(req, res) {	
			renderComponent(req, res, presentationCtrl.getByRemoteToken(req.params.token), new Remote());
			logger.remote.requested(req);
		});
		
		return this;
	};
	
	this.setupRoutesStatic = function() {
		var paths = [];

		// Document root
		paths.push(serverConfig.requestBasePath);
		
		// Shared between dev and prod (videos, large files)
		paths.push(path.normalize(serverConfig.appBasePath + '/../shared_public'));

		paths.forEach(function(path) {
			app.use(express.static(path));
		});
		return this;
	};
}

module.exports = new Routes();
