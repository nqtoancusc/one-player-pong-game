var _ = require('underscore')
	, presentationCtrl = require('../PresentationController')
	, Component = require('../Component')
	;

function EnterCode(opts) {
	opts = opts || {};
	if (!opts.scheme) {
		this.setScheme(presentationCtrl.getDefaultScheme());
	}
	if (opts.validationErrors) {
		this.validationErrors = opts.validationErrors;
	}
}

_.extend(EnterCode.prototype, Component.prototype, {

	componentName: 'enterCode',
	templateDir: 'remote',
	file: 'enterCode.html'

});

module.exports = EnterCode;