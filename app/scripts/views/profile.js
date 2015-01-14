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

  var ProfileView = Backbone.View.extend({
    tagName: 'section',
    id: 'popupProfile',
    className: 'popup popup_profile',

    template: _.template( $('#templateProfile').html() ),

    initialize: function() {
      
    },

    render: function() {
      var template = this.$el.html( this.template() );
      $('.popups').append(template);
      return this;
    },

    openPopup: function() {
      this.$el.add('.popups').addClass('is-overlay');
    }
  });

  return ProfileView;

});
