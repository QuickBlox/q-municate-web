/*
 * Q-municate chat application
 *
 * Profile View
 *
 */

define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone) {

  var App;

  var ProfileView = Backbone.View.extend({
    tagName: 'section',
    id: 'popupProfile',
    className: 'popup popup_profile',

    initialize: function(params) {
      if (typeof params === 'object') {
        App = params.app;
      }
    },

    render: function() {
      // this.$el.html( this.model.get('name') + ' (' + this.model.get('age') + ') - ' + this.model.get('occupation') );
    }
  });

  return ProfileView;

});
