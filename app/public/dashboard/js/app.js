/* global angular */

angular.module('mindowDashboard', ['ngRoute', 'ui.bootstrap'])

	.constant('mdbConf', {
		apiUrl: '/dashboard/api/',
		pages: {
			home: {
				order: 1,
				title: 'Home',
				controller: 'Home',
				templateUrl: 'dashboard/view/home.html'
			},
			unique: {
				order: 2,
				title: 'Unique Visitors',
				controller: 'Unique',
				templateUrl: 'dashboard/view/unique.html'
			},
			session: {
				order: 3,
				title: 'Sessions',
				controller: 'Session',
				templateUrl: 'dashboard/view/session.html'
			},
			log: {
				order: 4,
				title: 'Logs',
				controller: 'Log',
				templateUrl: 'dashboard/view/log.html'
			}
		}
	})

	.config(function($routeProvider, mdbConf) {
		angular.forEach(mdbConf.pages, function(config, route) {
			$routeProvider.when('/' + route + '/:ref?/:id?', config);
		});
		$routeProvider.otherwise({ redirectTo: '/home/' });
	})

	.controller('Statistics', function($scope, mdbConf) {
		$scope.dateFormat = 'dd.MM.yy HH.mm:ss';
		$scope.captions = {};
		$scope.nav = [];
		$scope.order = 'order';
		angular.forEach(mdbConf.pages, function(config, route) {
			var page = angular.extend({}, config, { route: route });
			$scope.captions[route] = config.title;
			$scope.nav.push(page);
			if (route === 'home') {
				$scope.selectedPage = route;
			}
		});
		$scope.setSelectedPage = function(page) {
			$scope.selectedPage = page;
		};
	})

	.controller('Home', function() {

	})

	.controller('Overviews', function($scope, Backend) {
		Backend.get(['remoteOrigins']).then(function(data) {
			$scope.remoteOrigins = data;
		});
		Backend.get(['userSessions']).then(function(data) {
			$scope.userSessions = data;
		});
	})

	.controller('Unique', function($scope, $routeParams, Backend, Pagination) {
		var p = $routeParams;
		Backend.get(['uuid']).then(function(data) {
			$scope.rows = data;
			Pagination.enable($scope, 'rows');
		});
		if (p && p.ref && p.id && p.ref === 'UuidId') {
			$scope.setSelectedPage('unique');
			$scope.uniqueSessionsUuidId = p.id;
			Backend.get(['session', p.ref, p.id]).then(function(data) {
				$scope.uniqueSessions = data;
				Pagination.enable($scope, 'uniqueSessions');
			});
		}
	})

	.controller('Session', function($scope, $routeParams, Backend, Pagination) {
		var p = $routeParams;
		Backend.get(['session']).then(function(data) {
			$scope.rows = data;
			Pagination.enable($scope, 'rows');
		});
		if (p && p.ref && p.id && p.ref === 'SessionId') {
			$scope.setSelectedPage('session');
			$scope.sessionLogsSessionId = p.id;
			Backend.get(['log', p.ref, p.id]).then(function(data) {
				$scope.sessionLogsSession = data;
			Pagination.enable($scope, 'sessionLogsSession');
			});
		}
	})

	.controller('Log', function($scope, Backend, Pagination) {
		Backend.get(['log']).then(function(data) {
			$scope.rows = data;
			Pagination.enable($scope, 'rows');
		});
	})

	.factory('Pagination', function() {
		return {
			enable: function(scope, target) {
				var pagination = {
					maxSize: 7,
					itemsPerPage: 10,
					itemsAmounts: [2, 5, 10, 25, 50, 100]
				};
				pagination.setItemsPerPage = function(value) {
					if (!value) {
						return;
					}
					pagination.itemsPerPage = value;
					pagination.setPage(1);
				};
				pagination.setPage = function(pageNo) {
					if (!pageNo || !scope[target] || !scope[target].length) {
						return;
					}
					var offset = (pageNo - 1) * pagination.itemsPerPage;
					pagination.currentPage = pageNo;
					pagination.itemsShow =
							scope[target].slice(offset, offset + pagination.itemsPerPage);
				};

				scope.$watch('pagination.' + target + '.itemsPerPage', pagination.setItemsPerPage);
				scope.$watch('pagination.' + target + '.currentPage', pagination.setPage);

				scope.pagination = scope.pagination || {};
				scope.pagination[target] = pagination;
			}
		};
	})

	.factory('Backend', function($q, $http, mdbConf) {
		var get = function(params) {
			var deferred = $q.defer();
			if (!(params && typeof params.join === 'function')) {
				params = [];
			}
			$http.get(mdbConf.apiUrl + params.join('/'))
				.success(function(response) {
					if (response.status === 0) {
						deferred.resolve(response.data);
					} else {
						deferred.reject(response.message);
					}
				});
			return deferred.promise;
		};
		return { get: get };
	})

	.directive('paginationControls', function() {
		return {
			scope: {
				allRows: '=',
				paginationRows: '='
			},
			templateUrl: 'dashboard/view/paginationControls.html'
		};
	});
