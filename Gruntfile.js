'use strict';

var SERVER_PORT = 9000;
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // configurable paths
  var yeomanConfig = {
    app: 'app',
    dist: 'dist'
  };

  grunt.initConfig({
    yeoman: yeomanConfig,
    pkg: grunt.file.readJSON('bower.json'),
    banner: '/* <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */',

    // jshint: {
    //   options: {
    //     jshintrc: '.jshintrc',
    //     reporter: require('jshint-stylish')
    //   },
    //   all: [
    //     'Gruntfile.js',
    //     '<%= yeoman.app %>/scripts/{,*/}*.js',
    //     '!<%= yeoman.app %>/vendor/*',
    //     'test/spec/{,*/}*.js'
    //   ]
    // },

    clean: {
      dev: ['.sass-cache', '.tmp'],
      dist: ['.sass-cache', '.tmp', '<%= yeoman.dist %>/*']
    },

    // handlebars: {
    //   compile: {
    //     options: {
    //       namespace: 'JST',
    //       amd: true
    //     },
    //     files: {
    //       '.tmp/scripts/templates.js': ['<%= yeoman.app %>/scripts/templates/*.hbs']
    //     }
    //   }
    // },

    compass: {
      options: {
        cssDir: '.tmp/css',
        sassDir: '<%= yeoman.app %>/styles',
        javascriptsDir: '<%= yeoman.app %>/scripts',
        imagesDir: '<%= yeoman.app %>/images',
        noLineComments: true,
        relativeAssets: true,
        raw: 'preferred_syntax = :scss\n'
      },
      dist: {
        options: {
          outputStyle: 'compressed'
        }
      },
      dev: {}
    },

    // bower: {
    //   all: {
    //     rjsConfig: '<%= yeoman.app %>/scripts/main.js'
    //   }
    // },

    // requirejs: {
    //   dist: {
    //     // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js

    //     options: {
    //       mainConfigFile: "<%= yeoman.app %>/scripts/main.js",
    //       baseUrl: '<%= yeoman.app %>/scripts',
    //       name: 'main',
    //       optimize: 'none',
    //       paths: {
    //         'templates': '../../.tmp/scripts/templates',
    //         'jquery': '../../<%= yeoman.app %>/bower_components/jquery/dist/jquery.min',
    //         'underscore': '../../<%= yeoman.app %>/bower_components/lodash/dist/lodash.min',
    //         'backbone': '../../<%= yeoman.app %>/bower_components/backbone/backbone'
    //       },
    //       out: "<%= yeoman.dist %>/scripts/main.min.js",
    //       preserveLicenseComments: false,
    //       useStrict: true
    //     }
    //   }
    // },

    watch: {
      options: {
        nospawn: true
      },
      scripts: {
        files: ['{.tmp,<%= yeoman.app %>}/scripts/{,*/}*.js'],
        tasks: []
      },
      css: {
        files: ['{.tmp,<%= yeoman.app %>}/styles/{,*/}*.scss'],
        tasks: ['compass:dev']
      },
      // handlebars: {
      //   files: [
      //     '<%= yeoman.app %>/scripts/templates/*.hbs'
      //   ],
      //   tasks: ['handlebars']
      // },
      // test: {
      //   files: ['<%= yeoman.app %>/scripts/{,*/}*.js', 'test/spec/**/*.js'],
      //   tasks: ['test:true']
      // }
    },

    useminPrepare: {
      html: '<%= yeoman.app %>/index.html',
      options: {
        dest: '<%= yeoman.dist %>'
      }
    },

    cssmin: {
      dist: {
        options: {
          banner: '<%= banner %>'
        },
        files: {
          '<%= yeoman.dist %>/<%= pkg.name %>.min.css': ['.tmp/concat/css/{,*/}*.css']
        }
      }
    },

    uglify: {
      dist: {
        options: {
          banner: '<%= banner %>'
        },
        files: {
          '<%= yeoman.dist %>/<%= pkg.name %>.min.js': ['.tmp/concat/js/{,*/}*.js']
        }
      }
    },

    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg}',
          dest: '<%= yeoman.dist %>/images'
        }]
      }
    },

    htmlmin: {
      dist: {
        options: {
          /*removeCommentsFromCDATA: true,
          // https://github.com/yeoman/grunt-usemin/issues/44
          //collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeOptionalTags: true*/
        },
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>',
          src: '*.html',
          dest: '<%= yeoman.dist %>'
        }]
      }
    },

    rev: {
      dist: {
        files: {
          src: [
            '<%= yeoman.dist %>/scripts/{,*/}*.js',
            '<%= yeoman.dist %>/styles/{,*/}*.css',
            '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp}',
            '/styles/fonts/{,*/}*.*',
          ]
        }
      }
    },

    usemin: {
      html: ['<%= yeoman.dist %>/{,*/}*.html'],
      css: ['<%= yeoman.dist %>/*.min.css'],
      js: ['<%= yeoman.dist %>/*.min.js']
      options: {
        dirs: ['<%= yeoman.dist %>']
      }
    },

    copy: {
      dist: {
        files: {
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          src: [
            '*.{ico,png}',
            'images/{,*/}*.{svg}',
            'audio/{,*/}*.*'
          ],
          dest: '<%= yeoman.dist %>'
        }
      }
    },

    connect: {
      options: {
        port: grunt.option('port') || SERVER_PORT,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      dev: {
        options: {
          middleware: function (connect) {
            return [
              mountFolder(connect, '.tmp'),
              mountFolder(connect, yeomanConfig.app)
            ];
          }
        }
      },
      test: {
        options: {
          port: 9001,
          middleware: function (connect) {
            return [
              mountFolder(connect, '.tmp'),
              mountFolder(connect, 'test'),
              mountFolder(connect, yeomanConfig.app)
            ];
          }
        }
      },
      dist: {
        options: {
          middleware: function (connect) {
            return [
              mountFolder(connect, yeomanConfig.dist)
            ];
          }
        }
      }
    },

    open: {
      server: {
        path: 'http://localhost:<%= connect.options.port %>'
      },
      test: {
        path: 'http://localhost:<%= connect.test.options.port %>'
      }
    },

    // mocha: {
    //   all: {
    //     options: {
    //       run: true,
    //       urls: ['http://localhost:<%= connect.test.options.port %>/index.html']
    //     }
    //   }
    // }
  });

  // grunt.registerTask('createDefaultTemplate', function () {
  //   grunt.file.write('.tmp/scripts/templates.js', 'this.JST = this.JST || {};');
  // });

  grunt.registerTask('server', function (target) {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve' + (target ? ':' + target : '')]);
  });

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'open:server', 'connect:dist:keepalive']);
    }

    // if (target === 'test') {
    //   return grunt.task.run([
    //     'clean:dev',
    //     'createDefaultTemplate',
    //     'handlebars',
    //     'connect:test',
    //     'open:test',
    //     'watch'
    //   ]);
    // }

    grunt.task.run([
      'clean:dev',
      // 'createDefaultTemplate',
      // 'handlebars',
      'connect:dev',
      'open:server',
      'watch'
    ]);
  });

  // grunt.registerTask('test', function (isConnected) {
  //   isConnected = Boolean(isConnected);
  //   var testTasks = [
  //       'clean:dev',
  //       'createDefaultTemplate',
  //       'handlebars',
  //       'connect:test',
  //       'mocha',
  //     ];

  //   if(!isConnected) {
  //     return grunt.task.run(testTasks);
  //   } else {
  //     // already connected so not going to connect again, remove the connect:test task
  //     testTasks.splice(testTasks.indexOf('connect:test'), 1);
  //     return grunt.task.run(testTasks);
  //   }
  // });

  grunt.registerTask('build', [
    'clean:dist',
    'compass:dev',
    // 'createDefaultTemplate',
    // 'handlebars',
    'useminPrepare',
    // 'requirejs',
    'concat',
    'cssmin',
    'uglify',
    // 'imagemin',
    // 'htmlmin',
    // 'rev',
    'usemin',
    'copy'
  ]);

  grunt.registerTask('default', [
    // 'jshint',
    // 'test',
    'build'
  ]);
};
