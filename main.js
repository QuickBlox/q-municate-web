(function($, ChromaHash) {
  var APP = {
    init: function() {
      this.userActions();
      this.chromaHash();
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
    },

    chromaHash: function() {
      new ChromaHash({
        visualization: 'bars'
      });
    }
  };
  
  APP.init();
})(jQuery, ChromaHash);
