(function($, ChromaHash) {
  var APP = {
    init: function() {
      this.userActions();
      this.chromaHash();
      this.chooseFile();
    },
    
    userActions: function() {
      var self = this;
      $('#signup').on('click', function() {
        self.removeWelcome();
        $('#welcomePage').addClass('is-hidden');
        $('#signUpPage').removeClass('is-hidden');
      });
      
      $('#login').on('click', function() {
        self.removeWelcome();
        $('#welcomePage').addClass('is-hidden');
        $('#loginPage').removeClass('is-hidden');
      });
      
      $('#loginQB').on('click', function() {
        self.removeWelcome();
        
      });
    },
    
    removeWelcome: function() {
      $('.is-welcome').removeClass('is-welcome');
    },

    chromaHash: function() {
      new ChromaHash({
        visualization: 'bars'
      });
    },

    chooseFile: function() {
      $('input:file').on('change', function() {
        var file = $(this)[0].files[0];
        var avatar = URL.createObjectURL(file);
        $(this).prev().find('.user-avatar').attr('src', avatar);
        $(this).prev().find('.user-name').text(file.name);
      });
    }
  };
  
  APP.init();
})(jQuery, ChromaHash);
