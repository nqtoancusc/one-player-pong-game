/*global module:false*/
/* jshint -W099 */
module.exports = function(grunt) {
	
	var paths = {
		dev: 'app/public',
		prod: 'dist'
	};

	function getRenamedProductionFiles(type) {
		var renamedFiles = {
			expand: true,
			cwd: paths.prod,
			src: ['presentations/*/**/*.' + type,'lib/qrremote-toolkit/*.' + type],
			dest: paths.prod,
			rename: function(dest, src) {
				return dest + '/' + src.replace('.' + type, '.min.' + type);
			}
		};
		return renamedFiles;
	}

	grunt.initConfig({
	    uglify: {
			options: {
				report: 'min',
				banner: '',
				compress: {
					drop_console: true
				}
			},
			dist: getRenamedProductionFiles('js')
		},

		clean: {
			dist: paths.prod
		},

		copy: {
			dist: {
				expand: true,
				cwd: paths.dev,
				src: [ '**' ],
				dest: paths.prod
			}
		},

		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			app_files: {
				src: [			
					'app/lib/**/*.js',
					paths.dev + '/lib/qrremote-toolkit/*.js',
					paths.dev + '/presentations/**/*.js',
					paths.dev + '/dashboard/**/*.js'
				]
			}
		},

		watch: {
			css: {
				files: [				
					paths.dev + '/presentations/**/*.css',
					paths.dev + '/dashboard/**/*.css'

				],
				options: { livereload: true }
			},
			html: {
				files: [				
					paths.dev + '/presentations/**/*.html',
					paths.dev + '/dashboard/**/*.html'
				],
				options: { livereload: true }
			},
			lib_test: {
				files: '<%= jshint.app_files.src %>',
				tasks: ['jshint:app_files']
			},
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			server: {
				files: ['.grunt/rebooted'],
				options: { livereload: true }
			}
		},

		concurrent: {
			dev: {
				tasks: ['nodemon', 'node-inspector', 'watch'],
				options: { logConcurrentOutput: true }
			}
		},

		nodemon: {
			dev: {
				script: 'app/server.js',
				options: {
					cwd: __dirname,
					nodeArgs: ['--debug'],
					env: {
						PORT: '8501',
						DEV: true
					},
					ignore: ['node_modules/**'],
					callback: function(nodemon) {
						nodemon.on('log', function(event) {
							console.log(event.colour);
						});
						// Refreshes browser when server reboots
						nodemon.on('restart', function() {
							setTimeout(function() {
								require('fs').writeFileSync('.grunt/rebooted', 'rebooted');
							}, 2000);
						});
					}
				}
			}
		},

		'node-inspector': {
			dev: { }
		}
		
	});
	
	require('load-grunt-tasks')(grunt);
  
	grunt.registerTask('default', ['concurrent']);

	grunt.registerTask('build', [
		'clean:dist',
		'copy',
		'uglify',
		]);
};