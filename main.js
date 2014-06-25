(function($) {
  var APP = {
    init: function() {
      this.userActions();
    },
    
    userActions: function() {
      $('#connectFB').on('click', function() {
        this.removeWelcome();
        
      });
      
      $('#signupQB').on('click', function() {
        this.removeWelcome();
        
      });
      
      $('#loginQB').on('click', function() {
        this.removeWelcome();
        
      });
    },
    
    removeWelcome: function() {
      $('body').removeClass('is-welcome');
    }
  };
  
  APP.init();
})(jQuery);
