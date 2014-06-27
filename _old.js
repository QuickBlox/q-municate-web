(function($, ChromaHash, QB) {
  var switches = {
        isFBconnected: false
      };
  var APP = {
    init: function() {
      var self = this;
      $.ajaxSetup({ cache: true });
      $.getScript('https://connect.facebook.net/en_EN/all.js', function() {
        FB.init({
          appId: '848540871842455',
          status: false
        });
        QB.init(QBAPP.appId, QBAPP.authKey, QBAPP.authSecret, true);
        self.subscribeFBStatusEvent();
        self.userActions();
        self.chromaHash();
        self.chooseFile();
      });
    },

    subscribeFBStatusEvent: function() {
      var self = this;
      FB.Event.subscribe('auth.statusChange', function(response) {
        if (response.status == 'connected') {
          QB.createSession({provider: 'facebook', scope: 'friends_status,read_mailbox,photo_upload', keys: {token: response.authResponse.accessToken}}, function(err, result) {
                if (err) {
                  console.log(err.detail);
                } else {
                  console.log('Login via Facebook complete');
                  //getQBUser(result.user_id, result.token, (storage ? storage.pass : null));
                 // self.success($('#emailField'), result.user_id, 'Login complete with user ID ');
                }
              });
          setTimeout(function() {switches.isFBconnected = true}, 1000);
        }
      });
    },
    
    userActions: function() {
      var params, self = this;
      

      $('#signup').on('click', function() {
        self.removeWelcome();
        $(this).parents('section').addClass('is-hidden');
        $('#signUpPage').removeClass('is-hidden');
      });
      
      $('#login').on('click', function() {
        self.removeWelcome();
        $(this).parents('section').addClass('is-hidden');
        $('#loginPage').removeClass('is-hidden');
      });
      
      $('#forgot').on('click', function() {
        $(this).parents('section').addClass('is-hidden');
        $('#forgotPage').removeClass('is-hidden');
      });

      $('#facebook, #facebook2').on('click', function() {
        var self = this;
        FB.getLoginStatus(function(response) {
          switch (response.status) {
          case 'connected':
            if (switches.isFBconnected)
              QB.createSession({provider: 'facebook', keys: {token: response.authResponse.accessToken}}, function(err, result) {
                if (err) {
                  console.log(err.detail);
                } else {
                  //getQBUser(result.user_id, result.token, (storage ? storage.pass : null));
                  self.success($('#emailField'), result.user_id, 'Login complete with user ID ');
                }
              });
            break;
          case 'not_authorized':
            FB.login();
            break;
          case 'unknown':
            FB.login();
            break;
          }
        });
      });

      $('#dataLogin').on('click', function(event) {
        event.preventDefault();
        //$('input').val('');
        $('.form-text_success').removeClass('form-text_success');
        /*var form = $(this).parents(".l-form")[0];
        form.noValidate = true;
        form.onsubmit = function(){
          for (var f = 0; f < form.elements.length; f++) {
            var field = form.elements[f];
            console.log(field.validity);
          }
          return false;
        };*/


        params = {
          email: $('#emailField').val(),
          password: $('#passField').val()
        };

        if (params.email.trim() && params.password.trim()) {
          QB.createSession(params, function(err, result) {
            if (err) {
              console.log(err.detail);
              self.fail($('#emailField'), '', JSON.parse(err.detail).errors[0]);
            } else {
              //getQBUser(result.user_id, result.token, (storage ? storage.pass : null));
              self.success($('#emailField'), result.user_id, 'Login complete with user ID ');
            }
          });
        }
        else
          self.fail($('#emailField'), '', 'You must fill the form');
      });

      $('#dataSignup').on('click', function(event) {
        event.preventDefault();
        //$('input').val('');
        $('.form-text_success').removeClass('form-text_success');
        /*var form = $(this).parents(".l-form")[0];
        form.noValidate = true;
        form.onsubmit = function(){
          for (var f = 0; f < form.elements.length; f++) {
            var field = form.elements[f];
            console.log(field.validity);
          }
          return false;
        };*/


        params = {
          full_name: $('#name').val(),
          email: $('#email').val(),
          password: $('#pass').val()
        };

        if (params.full_name.trim() && params.email.trim() && params.password.trim()) {
          QB.createSession(function(err, result) {
            QB.users.create(params, function(err, result) {
              if (err) {
                console.log(err.detail);
                self.fail($('#name'), Object.keys(JSON.parse(err.detail).errors)[0], JSON.parse(err.detail).errors[Object.keys(JSON.parse(err.detail).errors)[0]]);
              } else {
                //getQBUser(result.user_id, result.token, (storage ? storage.pass : null));
                self.success($('#name'), result.id, 'User created with ID ');
              }
            });
          });
        }
        else
          self.fail($('#name'), '', 'You must fill the form');
      });
    },

    fail: function(obj, prop, err) {
      obj.parents('.l-form').find('.form-text_error').text(prop + ' ' + err).removeClass('is-invisible');
      obj.parents('.l-form').find('input').addClass('is-error');
    },

    success: function(obj, id, msg) {
      obj.parents('.l-form').find('.form-text_error').addClass('form-text_success').text(msg + id).removeClass('is-invisible');
      $('input').removeClass('is-error');
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
})(jQuery, ChromaHash, QB);
