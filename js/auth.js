/*
 * Q-municate chat application
 *
 * Authorization Module
 *
 */

module.exports = Auth;
var QBApiCalls = require('./qbApi');

function Auth() {
  this.signupParams = {
    fullName: $('#signupName').val().trim(),
    email: $('#signupEmail').val().trim(),
    password: $('#signupPass').val().trim(),
    avatar: $('#signupAvatar')[0].files[0] || null
  };
};

Auth.prototype.signup = function(objDom) {
  var self = this;

  QBApiCalls.createSession({}, function(){});
  //validate(objDom);

  /*QBApiCalls.createSession({},
    function() {
      QBApiCalls.createUser({
        full_name: self.signupParams.fullName,
        email: self.signupParams.email,
        password: self.signupParams.password
      });
    },
    function(errMsg) {
      fail(objDom, errMsg);
    }
  );*/
};

// Private methods
function validate(objDom) {
  var form = objDom.parents('form');

  form.find('input').each(function() {
    this.value = this.value.trim();

    if (!this.checkValidity()) {
      console.log(this.checkValidity());
      if (this.validity.valueMissing) {
        fail(objDom, 'Name is required');
      } else if (this.validity.typeMismatch) {
        fail(objDom, '');
      } else if (this.validity.patternMismatch) {
        if (this.value.length < 3 || this.value.length > 50)
          fail(objDom, 'Minimum length is 3 symbols, maximum is 50');
        else
          fail(objDom, 'Bad format');
      }

      $(this).addClass('is-error');

      return false;
    }
  });

// // console.log(form.elements.length);
//   for (i = 0, len = form.elements.length; i < len; i++) {
//     elem = form.elements[i];
//     console.log(elem);
//     //if (elem.localName !== 'input') continue;

    
//   }
  /*form.find('input').each(function(i) {
    this.value = this.value.trim();
    if (i === 2) {
      console.log(this);
      console.log(this.value);
      console.log(this.checkValidity());
      console.log(this.validity);
      console.log(this.validationMessage);
    }
  });*/
  /*form.noValidate = true;
  form.onsubmit = function(){
    for (var f = 0; f < form.elements.length; f++) {
      var field = form.elements[f];
      console.log(field.validity);
    }
    return false;
  };*/
}

function fail(objDom, errMsg) {
  objDom.parents('form').find('.form-text_error').removeClass('is-invisible').text(errMsg);
}
