var switches = {
  isFBconnected: false
};

$.ajaxSetup({ cache: true });
$.getScript('https://connect.facebook.net/en_EN/all.js', function() {
  FB.init({
    appId: '848540871842455',
    status: false
  });
  self.subscribeFBStatusEvent();
});

subscribeFBStatusEvent: function() {
  var self = this;
  FB.Event.subscribe('auth.statusChange', function(response) {
    if (response.status == 'connected') {
      QB.createSession({provider: 'facebook', scope: 'friends_status,read_mailbox,photo_upload', keys: {token: response.authResponse.accessToken}}, function(err, result) {
            if (err) {
              console.log(err.detail);
            } else {
              console.log('Login via Facebook complete');
            }
          });
      setTimeout(function() {switches.isFBconnected = true}, 1000);
    }
  });
},

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
