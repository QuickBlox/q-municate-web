/*
 * Q-municate chat application
 *
 * Attach View Module
 *
 */

module.exports = AttachView;

var User, Message, ContactList, Dialog;
var self;

function AttachView(app) {
  this.app = app;
  User = this.app.models.User;
  Dialog = this.app.models.Dialog;
  Message = this.app.models.Message;
  ContactList = this.app.models.ContactList;
  self = this;
}

AttachView.prototype = {

  changeInput: function(objDom) {
    var file = objDom[0].files[0] || null,
        chat = $('.l-chat:visible .l-chat-content .mCSB_container'),
        id = _.uniqueId(),
        fileSize = file.size,
        fileSizeCrop = fileSize > (1024 * 1024) ? (fileSize / (1024 * 1024)).toFixed(1) : (fileSize / 1024).toFixed(1),
        fileSizeUnit = fileSize > (1024 * 1024) ? 'Mb' : 'Kb',
        html;

    console.log(file);
    if (file) {
      if (file.name.length < 18)
        html = '<article class="message message_service message_attach message_attach_row l-flexbox l-flexbox_alignstretch">';
      else
        html = '<article class="message message_service message_attach l-flexbox l-flexbox_alignstretch">';
      html += '<span class="message-avatar contact-avatar_message request-button_attach">';
      html += '<img src="images/icon-attach.png" alt="attach"></span>';
      html += '<div class="message-container-wrap">';
      html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
      html += '<div class="message-content">';
      html += '<h4 class="message-author">';
      html += file.name;
      html += '<div class="attach-upload">';
      html += '<div id="progress_'+id+'"></div>';
      html += '<span class="attach-size"><span class="attach-part attach-part_'+id+'"></span> of ' + fileSizeCrop + ' ' + fileSizeUnit + '</span>';
      html += '</div></h4></div>';
      html += '<time class="message-time"><a class="attach-cancel" href="#">Cancel</a></time>';
      html += '</div></div></article>';
      
      chat.append(html);
      fixScroll();
      createProgressBar(id, fileSizeCrop, fileSize);
    }
  },

  cancel: function(objDom) {
    objDom.parents('article').remove();
  }

};

/* Private
---------------------------------------------------------------------- */
function createProgressBar(id, fileSizeCrop, fileSize) {
  var progressBar = new ProgressBar('progress_'+id),
      percent = 5,
      part, time;

  // TODO: Need to rewrite this part of code
  if (fileSize < 100 * 1024)
    time = 50;
  else if (fileSize < 300 * 1024)
    time = 100;
  else if (fileSize < 400 * 1024)
    time = 150;
  else if (fileSize < 500 * 1024)
    time = 200;
  else if (fileSize < 600 * 1024)
    time = 250;
  else if (fileSize < 700 * 1024)
    time = 300;
  else if (fileSize < 800 * 1024)
    time = 350;
  else if (fileSize < 900 * 1024)
    time = 400;
  else if (fileSize < 1 * 1024 * 1024)
    time = 500;
  else if (fileSize < 2 * 1024 * 1024)
    time = 750;
  else if (fileSize < 4 * 1024 * 1024)
    time = 1000;
  else if (fileSize < 5 * 1024 * 1024)
    time = 1250;
  else if (fileSize < 7 * 1024 * 1024)
    time = 1500;
  else if (fileSize < 8 * 1024 * 1024)
    time = 1750;
  else if (fileSize < 10 * 1024 * 1024)
    time = 2000;

  setPercent();

  function setPercent() {
    progressBar.setPercent(percent);
    part = (fileSizeCrop * percent / 100).toFixed(1);
    $('.attach-part_'+id).text(part);
    percent += 5;
    if (percent > 95) return false;
    setTimeout(setPercent, time);
  }  
}

function fixScroll() {
  var chat = $('.l-chat:visible'),
      containerHeight = chat.find('.l-chat-content .mCSB_container').height(),
      chatContentHeight = chat.find('.l-chat-content').height(),
      draggerContainerHeight = chat.find('.l-chat-content .mCSB_draggerContainer').height(),
      draggerHeight = chat.find('.l-chat-content .mCSB_dragger').height();

  chat.find('.l-chat-content .mCSB_container').css({top: chatContentHeight - containerHeight + 'px'});
  chat.find('.l-chat-content .mCSB_dragger').css({top: draggerContainerHeight - draggerHeight + 'px'});
}
