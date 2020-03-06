var winston = require('winston')
	, serverConfig = require('./serverConfig')
	, database = require('./lib/database')
	, express = require('express.io')
	;

function setupServer(app) {
	var routes = require('./lib/Routes')
		, randomtoken = require('./lib/util/RandomToken')
		;

	//Configuring socket.io (google "configuring socket.io" for details)
	if (!serverConfig.isDev) {
		// Production settings
		app.io.enable('browser client minification');
		app.io.enable('browser client etag');
		app.io.enable('browser client gzip');
		app.io.set('log level', 1);
		app.io.set('transports', [
			'websocket',
			'flashsocket',
			'htmlfile',
			'xhr-polling',
			'jsonp-polling'
		]);
	} else {
		// Development
		app.io.set('logger', {
	        debug: winston.debug,
	        log: winston.info,
	        info: winston.info,
	        error: winston.error,
	        warn: winston.warn
	    });
		app.io.set('log level', 4);
	}

	//to support URL-encoded bodies
	app.use(express.urlencoded());

	// Setting up session
	app.use(express.cookieParser());
	app.use(express.session({ secret: randomtoken.get(15) }));

	routes
		.setup(app)
		.setupRoutesActive()
		.setupRoutesStatic();

	return app;
}

winston.info('Initializing database');
database.init(function() {
	var logger = require('./lib/util/Logger')
		, presentationCtrl = require('./lib/PresentationController')
		, presentationsConfig = require('./presentations.json')
		, Presentation = require('./lib/Presentation')
		, signals = require('./lib/Signals')
		;

	var http = setupServer(express().http().io());

	(new Presentation()).setRemoteTokenLength(serverConfig.remoteTokenLength);
	presentationCtrl.init(presentationsConfig);

	// Start listening to requests and signals
	signals.setup(http);

	http.listen(serverConfig.port, serverConfig.hostname);

	winston.info(['Servers listens on port', serverConfig.port]
		.join(', '));
	logger.system.ready(JSON.stringify(serverConfig));
});