var _ = require('underscore')
	, serverConfig = require('../serverConfig')
	, fs = require('fs')
	;

function Component() {
}

_.extend(Component.prototype, {
	
	scheme: '',
	file: 'index.html',
	
	render: function(req, res) {
		var schemePath = this.getSchemePath();
		var templatePath = schemePath + this.getTemplatePath();
		var templateConfig = _.extend(
				this.getTplConfig(schemePath),
				this.getFormValidationResults(),
				this.getPostVals(),
				this.getBaseAddresses(req.headers.host));

		templateConfig.formEnabled = serverConfig.formEnabled;
		templateConfig.addTracking = !serverConfig.isDev;
		
		if (fs.existsSync(serverConfig.requestBasePath + '/' + templatePath)) {
			res.render(templatePath, templateConfig);
		} else {
			res.redirect('/');
		}
	},
	
	getSchemePath: function() {
		if (!this.getScheme()) {
			throw new Error('No scheme defined');
		}
		var path = [
			'presentations',
			this.getScheme()
        ];
		return path.join('/');
	},

	getTemplatePath: function() {
		var templateDir = this.templateDir ? this.templateDir : this.componentName;
		return '/' + templateDir + '/' + this.file;
	},

	getTplConfig: function(schemePath) {
		var configFile = serverConfig.requestBasePath + '/' + schemePath + '/config.json';
		var config = fs.existsSync(configFile) ? require(configFile) : {};
		return config;
	},

	getFormValidationResults: function() {
		return {
			validationErrors: this.validationErrors || {},
			ok: this.ok || false,
			senderror: this.senderror || false
		};
	},

	getPostVals: function() {
		return {
			postVals: this.postVals || {}
		};
	},

	getBaseAddresses: function(host) {
		var hostname = typeof host === 'string' ? host.split(':')[0] : '';
		var httpPort = serverConfig.port;
		var httpsPort = serverConfig.portSsl;
		return {
			httpBase: hostname + (httpPort !== 80 ? (':' + httpPort) : ''),
			httpsBase: hostname + (httpsPort !== 443 ? (':' + httpsPort) : ''),
		};
	},

	getScheme: function() {
		return this.scheme;
	},
	
	setScheme: function(scheme) {
		if (typeof scheme !== 'string' || !scheme.length) {
			return false;
		}
		this.scheme = scheme;
		return true;
	}
});

module.exports = Component;