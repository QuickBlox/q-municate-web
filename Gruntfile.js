'use strict';

var SERVER_PORT = 9000;

// # Globbing


module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // configurable paths
  var yeomanConfig = {
    app: 'app',
    dist: 'dist',
    originalScriptTag: '<script src="scripts/main.js"></script>',
    tmpScriptTag: '<script src="scripts/.build.js"></script>'
  };

  grunt.initConfig({
    yeoman: yeomanConfig,
    pkg: grunt.file.readJSON('bower.json'),
    banner: '/* <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n',

    clean: {
      dev: ['.sass-cache', '.tmp', '<%= yeoman.app %>/.css'],
      dist: ['.sass-cache', '.tmp', '<%= yeoman.app %>/.css',
             '<%= yeoman.dist %>/scripts', '<%= yeoman.dist %>/styles', '<%= yeoman.dist %>/vendor'],
      tmpBuild: ['<%= yeoman.app %>/scripts/.build.js']
    },

    compass: {
      compile: {
        options: {
          cssDir: '<%= yeoman.app %>/.css',
          sassDir: '<%= yeoman.app %>/styles',
          javascriptsDir: '<%= yeoman.app %>/scripts',
          imagesDir: '<%= yeoman.app %>/images',
          noLineComments: true,
          relativeAssets: true,
          raw: 'preferred_syntax = :scss\n'
        }
      }
    },

    handlebars: {
      compile: {
        options: {
          namespace: 'JST',
          amd: true
        },
        files: {
          '.tmp/scripts/templates.js': ['<%= yeoman.app %>/scripts/templates/*.hbs']
        }
      }
    },

    bower: {
      all: {
        rjsConfig: '<%= yeoman.app %>/scripts/main.js',
        options: {
          exclude: ['jquery', 'modernizr', 'requirejs']
        }
      }
    },

    requirejs: {
      dist: {
        options: {
          baseUrl: '<%= yeoman.app %>/scripts',
          mainConfigFile: "<%= yeoman.app %>/scripts/main.js",
          name: 'main',
          optimize: 'none',
          out: "<%= yeoman.app %>/scripts/.build.js",

          paths: {
            'templates': '.tmp/scripts/templates'
          },

          almond: false,
          preserveLicenseComments: false
        }
      }
    },

    watch: {
      options: {
        spawn: false
      },
      css: {
        files: ['<%= yeoman.app %>/styles/{,*/}*.scss'],
        tasks: ['compass']
      },
      handlebars: {
        files: [
          '<%= yeoman.app %>/scripts/templates/*.hbs'
        ],
        tasks: ['handlebars']
      }
    },

    useminPrepare: {
      html: '<%= yeoman.app %>/index.html',
      options: {
        dest: '<%= yeoman.dist %>'
      }
    },

    cssmin: {
      options: {
        banner: '<%= banner %>'
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      }
    },

    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg,svg}',
          dest: '<%= yeoman.dist %>/images'
        }]
      }
    },

    htmlmin: {
      dist: {
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
            '<%= yeoman.dist %>/vendor/{,*/}*.js',
          ]
        }
      }
    },

    usemin: {
      html: ['<%= yeoman.dist %>/{,*/}*.html'],
      options: {
        dirs: ['<%= yeoman.dist %>']
      }
    },

    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>',
          src: [
            '*.{ico,png}',
            'audio/{,*/}*.*'
          ],
          dest: '<%= yeoman.dist %>'
        }]
      }
    },

    connect: {
      options: {
        protocol: 'https',
        port: grunt.option('port') || SERVER_PORT,
        open: true,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      dev: {
        options: {
          base: [
            '.tmp',
            '<%= yeoman.app %>'
          ]
        }
      },
      dist: {
        options: {
          protocol: 'https',
          base: '<%= yeoman.dist %>'
        }
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        '<%= yeoman.app %>/scripts/{,*/}*.js',
        '!<%= yeoman.app %>/vendor/*'
      ]
    },

    includereplace: {
      prod: {
        options: {
          globals: {
            appId: '13318',
            authKey: 'WzrAY7vrGmbgFfP',
            authSecret: 'xS2uerEveGHmEun'
          }
        },
        src: '<%= yeoman.app %>/configs/environment.js',
        dest: '<%= yeoman.app %>/configs/main_config.js'
      },
      dev: {
        options: {
          globals: {
            appId: '36125',
            authKey: 'gOGVNO4L9cBwkPE',
            authSecret: 'JdqsMHCjHVYkVxV'
          }
        },
        src: '<%= yeoman.app %>/configs/environment.js',
        dest: '<%= yeoman.app %>/configs/main_config.js'
      },
      local: {
        src: '<%= yeoman.app %>/config.js',
        dest: '<%= yeoman.app %>/configs/main_config.js'
      }
    }
  });

  var envTarget = grunt.option('env') || 'local';

  grunt.registerTask('createDefaultTemplate', function () {
    grunt.file.write('.tmp/scripts/templates.js', 'this.JST = this.JST || {};');
  });

  grunt.registerTask('createTmpScriptTag', function (rollBack) {
    var path = yeomanConfig.app + '/index.html';
    var indexFile = grunt.file.read(path);
    if (typeof rollBack === 'undefined') {
      grunt.file.write(path, indexFile.replace(yeomanConfig.originalScriptTag, yeomanConfig.tmpScriptTag));
    } else {
      grunt.file.write(path, indexFile.replace(yeomanConfig.tmpScriptTag, yeomanConfig.originalScriptTag));
      grunt.task.run(['clean:tmpBuild']);
    }
  });

  grunt.registerTask('server', function (target) {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve' + (target ? ':' + target : '')]);
  });

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'includereplace:' + envTarget,
      'clean:dev',
      'compass',
      'createDefaultTemplate',
      'handlebars',
      'connect:dev',
      'watch'
    ]);
  });

  grunt.registerTask('build', [
    'jshint',
    'includereplace:' + envTarget,
    'clean:dist',
    'compass',
    'createDefaultTemplate',
    'handlebars',
    'requirejs',
    'createTmpScriptTag',
    'useminPrepare',
    'concat',
    'cssmin',
    'uglify',
    'newer:imagemin',
    'htmlmin',
    'rev',
    'usemin',
    'newer:copy',
    'createTmpScriptTag:rollBack'
  ]);

  grunt.registerTask('default', ['build']);
  grunt.registerTask('test', ['jshint']);

};
