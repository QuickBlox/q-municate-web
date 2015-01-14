/*
 * Q-municate chat application
 *
 * Person Model
 *
 */

define([  
  'underscore',
  'backbone',
  'config'
], function(_, Backbone, QMCONFIG) {

  var App;

  var Person = Backbone.Model.extend({
    defaults: {
      full_name: null,
      email: null,
      phone: null,
      avatar_url: QMCONFIG.defAvatar.url,
      status: null,
      facebook_id: null
    },

    parse: function(data, options) {
      if (typeof options === 'object') {
        App = options.app;
      }

      _.each(data, function(val, key) {
        var isHasKey = _.has(this.defaults, key);
        if (key !== 'id' && !isHasKey) {
          delete data[key];
        }
      }, this);

      return data;
    },

    initialize: function() {
      
    }

  });

  return Person;

});
