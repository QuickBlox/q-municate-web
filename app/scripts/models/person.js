/*
 * Q-municate chat application
 *
 * Person Model
 *
 */

define([
  'config',
  'underscore',
  'backbone'
], function(QMCONFIG, _, Backbone) {

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
      if (data && typeof data === 'object') {
        App = data.app;
      }

      _.each(data, function(val, key) {
        var isHasKey = _.has(this.defaults, key);
        if (!isHasKey) {
          delete data[key];
        }
      }, this);
    },

    initialize: function() {
      
    }

  });

  return Person;

});
