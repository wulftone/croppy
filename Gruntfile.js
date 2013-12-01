module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', 'mochaTest');

  grunt.initConfig({

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          growl: true,
          require: 'coffee-script'
        },
        src: ['test/**/*.js', 'test/**/*.coffee']
      }
    },

    watch: {
      scripts: {
        files: ['index.coffee', 'src/**/*.coffee', 'test/**/*.coffee'],
        tasks: ['mochaTest', 'browserify'],
      },
      example: {
        files: ['dist/*.js', 'example/*.html', 'Gruntfile.js'],
        options: {
          livereload: true
        }
      }
    },

    browserify: {
      dist: {
        files: {
          'dist/croppy.js': ['src/croppy.coffee'],
        },
        options: {
          transform: ['coffeeify'],
          standalone: 'Croppy'
        }
      }
    }
  });

};
