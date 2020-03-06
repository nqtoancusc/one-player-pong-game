var _ = require('underscore')
	, Component = require('../Component')
	;

function Screen() {
	this.timedOut = false;
}
_.extend(Screen.prototype, Component.prototype, {
	
	componentName: 'screen'

});

module.exports = Screen;