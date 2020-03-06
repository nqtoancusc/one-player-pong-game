var _ = require('underscore')
	, LogReader = require('./LogReader')
	, Uuid = require('../models/Uuid')
	, Session = require('../models/Session')
	, Log = require('../models/Log')
	;

function parseQueryParams(params) {
	var query = {
		limit: 100,
		offset: 0
	};
	if (parseInt(params.limit) && params.limit > 0 && params.limit <= 100) {
		query.limit = params.limit;
	}
	if (parseInt(params.offset) && params.offset >= 0) {
		query.offset = params.offset;
	}
	return query;
}

function parsePathParams_where(params) {
	var where = {};
	var parts;
	if (params && typeof params === 'string') {
		parts = params.split('/');
		if (parseInt(parts[0])) {
			// Expect number
			where.id = parts[0];
		} else if (parts[1]) {
			// Otherwise use reflection to query column names
			// Example: "UuidId/1" -> where.UuidId = 1
			where[parts[0]] = parts[1];
		}
	}
	return where;
}

function getTableRowsDirectly(model, pInclude) {
	return function() {
		var that = this;
		if (model && model.findAll) {
			model.findAll({
				where	: parsePathParams_where(this.params),
				include	: pInclude || [],
				limit	: this.query.limit,
				offset	: this.query.offset,
				order	: 'id DESC'
			}).success(function(results) {
				that.handleFindAllSuccess(results);
			});
		}
	};
}

function DashboardApi(res) {
	this.processing = true;
	this.res = res;
}
_.extend(DashboardApi.prototype, {

	parseParams: function(req) {
		var params = req.params;
		this.status = 1;
		
		if (!params || !_.isArray(params)) {
			this.message = 'Missing method';
		} else if (!this.methods.hasOwnProperty(params[0])) {
			this.message = 'Invalid method';
		} else {
			this.status = 0;
			this.method = params[0];
			this.params = params[1];
			this.query = parseQueryParams(req.query);
		}
	},

	processRequest: function() {
		if (!this.method) {
			this.processing = false;
			return;
		}
		this.methods[this.method].call(this);
	},

	writeResponse: function() {
		if (this.processing) {
			return;
		}
		var response = {
			status	: this.status || 0,
			message	: this.message || 'OK',
			data	: this.data || ''
		};
		this.res.json(response);
	},

	handleFindAllSuccess: function(results) {
		var data = [];
		_.each(results, function(result) {
			data.push(result && result.dataValues);
		});
		this.storeDataAndRespond(data);
	},

	storeDataAndRespond: function(data) {
		this.data = data;
		this.processing = false;
		this.writeResponse();
	},

	methods: {
		uuid	: getTableRowsDirectly(Uuid),
		session	: getTableRowsDirectly(Session, [ Log ]),
		log		: getTableRowsDirectly(Log, [ Session ]),

		remoteOrigins	: LogReader.getRemoteOrigins,
		userSessions	: LogReader.getUserSessions
	}
});

module.exports = {
	manage: function(req, res) {
		var api = new DashboardApi(res);
		api.parseParams(req);
		api.processRequest();
		api.writeResponse();
		return true;
	}
};