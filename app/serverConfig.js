/**
	Environment variables, only found in this file

	DEV						- Dev mode enabled
	PORT					- Override default port (default 8501)
	HOSTNAME				- Override default bound hostname
	REMOTE_TIMER_EXCLUSIVE	- Change exclusive control time, in seconds
	REMOTE_TIMER_DISCONNECT	- Change forced disconnect time, in seconds

	- Grunt is configured to use DEV
	- Run in production with defaults (unless debugging)
*/

var _ = require('underscore')
		, path = require('path')
		, winston = require('winston')
		, fs = require('fs')
		;

var PRODUCTION_HOSTNAME			= '127.0.0.1';
var PRODUCTION_SCREEN_IP_RANGE	= '';
var DENISE						= '192.168.200.35';

//var DEVELOPMENT_DB_URL			= 'mysql://mfabrik_pong:mfabrik_pong@' + DENISE + '/mfabrik_pong';
var DEVELOPMENT_DB_URL			= 'mysql://pong_oneplayer:pong_oneplayer@localhost/pong_oneplayer';
var PRODUCTION_DB_URL			= 'mysql://pong_oneplayer:pong_oneplayer@localhost/pong_oneplayer';

var isDev = !!process.env.DEV;

var checkPort = function(port) {
	if (!port) {
		return false;
	}
	port = parseInt(port);
	if (_.isNaN(port) || port < 80 || port > 65535) {
		throw new Error('Invalid port: (' + port + ')');
	}
	return port;
};

var defaults = {
	port				: (isDev ? 8501 : 80),
	hostname			: (isDev ? '0.0.0.0' : PRODUCTION_HOSTNAME),
	remoteTimerExclusive: 60*2,		// Seconds
	remoteTimerDisconnect: 60 * 30,	// Seconds
	screenBasicAuth		: 'pong:123',
	remoteTokenLength	: 2,
	appBasePath			: __dirname,
	requestBasePath		: path.normalize(__dirname + (isDev ? '/public' : '/../dist')),
	isDev				: isDev,
	dbUrl				: (isDev ? DEVELOPMENT_DB_URL : PRODUCTION_DB_URL)
};

var config = _.extend({}, defaults);

// Arguments/environment variable overrides
config.port =
		checkPort(process.argv[2]) ||
		checkPort(process.env.PORT) ||
		defaults.port;

config.remoteTimerExclusive =
		parseInt(process.env.REMOTE_TIMER_EXCLUSIVE) ||
		defaults.remoteTimerExclusive;

config.remoteTimerDisconnect =
		parseInt(process.env.REMOTE_TIMER_DISCONNECT) ||
		defaults.remoteTimerDisconnect;

config.hostname = process.env.HOSTNAME || config.hostname;

config.orderApiCall = !!process.env.ORDER_API_CALL;

config.dbUrl = !!process.env.LOCAL_DB ? PRODUCTION_DB_URL : config.dbUrl;
config.dbUrl = process.env.DB === 'DENISE' ? DEVELOPMENT_DB_URL : config.dbUrl;

winston.info('Configured for ' + (isDev ? 'DEV' : 'PROD') + ' environment');
winston.info('Configuration: ', config);

module.exports = config;
