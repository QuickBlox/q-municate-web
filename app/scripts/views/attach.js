/*
 * Q-municate chat application
 *
 * Attach View Module
 *
 */

define(['jquery', 'config', 'quickblox', 'underscore', 'progressbar'], function($, QMCONFIG, QB, _, ProgressBar) {

  var User, Message, Attach;
  var self;

  function AttachView(app) {
    this.app = app;
    User = this.app.models.User;
    Message = this.app.models.Message;
    Attach = this.app.models.Attach;
    self = this;
  }

  AttachView.prototype = {

    changeInput: function(objDom) {
      var file = objDom[0].files[0] || null,
          chat = $('.l-chat:visible .l-chat-content .mCSB_container'),
          id = _.uniqueId(),
          fileSize = file.size,
          fileSizeCrop = fileSize > (1024 * 1024) ? (fileSize / (1024 * 1024)).toFixed(1) : (fileSize / 1024).toFixed(1),
          fileSizeUnit = fileSize > (1024 * 1024) ? 'MB' : 'KB',
          maxSize = QMCONFIG.maxLimitFile * 1024 * 1024,
          errMsg, html;

      if (file) {
        if (file.name.length > 100)
          errMsg = QMCONFIG.errors.fileName;
        else if (file.size > maxSize)
          errMsg = QMCONFIG.errors.fileSize;

        if (errMsg) {
          html = '<article class="message message_service l-flexbox l-flexbox_alignstretch">';
          html += '<span class="message-avatar contact-avatar_message request-button_pending"></span>';
          html += '<div class="message-container-wrap">';
          html += '<div class="message-container l-flexbox l-flexbox_flexbetween l-flexbox_alignstretch">';
          html += '<div class="message-content">';
          html += '<h4 class="message-author message-error">'+errMsg+'</h4>';
          html += '</div>';
          html += '</div></div></article>';
          chat.append(html);
          objDom.val('');
          fixScroll();
          return false;
        }

        if (file.name.length < 17)
          html = '<article class="message message_service message_attach message_attach_row l-flexbox l-flexbox_alignstretch">';
        else
          html = '<article class="message message_service message_attach l-flexbox l-flexbox_alignstretch">';
        html += '<span class="message-avatar contact-avatar_message request-button_attach">';
        html += '<img src="images/icon-attach.svg" alt="attach"></span>';
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
        objDom.val('');
        fixScroll();
        if (file.type.indexOf('image') > -1) {
          Attach.crop(file, {w: 1000, h: 1000}, function(blob) {
            self.createProgressBar(id, fileSizeCrop, fileSize, blob);
          });
        } else {
          self.createProgressBar(id, fileSizeCrop, fileSize, file);
        }
      }
    },

    createProgressBar: function(id, fileSizeCrop, fileSize, file) {
      var progressBar = new ProgressBar('progress_'+id),
          percent = 5,
          isUpload = false,
          part, time;

      // TODO: Need to rewrite this part of code
      if (fileSize < 100 * 1024)
        time = 50;
      else if (fileSize < 300 * 1024)
        time = 200;
      else if (fileSize < 400 * 1024)
        time = 350;
      else if (fileSize < 500 * 1024)
        time = 400;
      else if (fileSize < 600 * 1024)
        time = 450;
      else if (fileSize < 700 * 1024)
        time = 550;
      else if (fileSize < 800 * 1024)
        time = 600;
      else if (fileSize < 900 * 1024)
        time = 650;
      else if (fileSize < 1 * 1024 * 1024)
        time = 1000;
      else if (fileSize < 2 * 1024 * 1024)
        time = 1400;
      else if (fileSize < 3 * 1024 * 1024)
        time = 2000;
      else if (fileSize < 4 * 1024 * 1024)
        time = 2700;
      else if (fileSize < 5 * 1024 * 1024)
        time = 3700;
      else if (fileSize < 6 * 1024 * 1024)
        time = 4900;
      else if (fileSize < 7 * 1024 * 1024)
        time = 5400;
      else if (fileSize < 8 * 1024 * 1024)
        time = 6600;
      else if (fileSize < 9 * 1024 * 1024)
        time = 7500;
      else if (fileSize < 10 * 1024 * 1024)
        time = 9000;

      setPercent();

      console.log(1111111, file);

      Attach.upload(file, function(blob) {
        console.log(2222222, blob);

        var chat;
        isUpload = true;
        if ($('#progress_'+id).length > 0) {
          chat = $('#progress_'+id).parents('.l-chat');
          setPercent();
          self.sendMessage(chat, blob, fileSize);
        }
      });

      function setPercent() {
        if (isUpload) {
          progressBar.setPercent(100);
          part = fileSizeCrop;
          $('.attach-part_'+id).text(part);

          setTimeout(function() {
            $('.attach-part_'+id).parents('article').remove();
          }, 50);

        } else {
          progressBar.setPercent(percent);
          part = (fileSizeCrop * percent / 100).toFixed(1);
          $('.attach-part_'+id).text(part);
          percent += 5;
          if (percent > 90) return false;
          setTimeout(setPercent, time);
        }      
      }  
    },

    cancel: function(objDom) {
      objDom.parents('article').remove();
    },

    sendMessage: function(chat, blob, size) {
      var MessageView = this.app.views.Message,
          attach = Attach.create(blob, size),
          jid = chat.data('jid'),
          id = chat.data('id'),
          dialog_id = chat.data('dialog'),
          time = Math.floor(Date.now() / 1000),
          type = chat.is('.is-group') ? 'groupchat' : 'chat',
          dialogItem = type === 'groupchat' ? $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog_id+'"]') : $('.l-list-wrap section:not(#searchList) .dialog-item[data-id="'+id+'"]'),
          copyDialogItem;
        
      // send message
      QB.chat.send(jid, {type: type, body: 'Attachment', extension: {
        save_to_history: 1,
        // dialog_id: dialog_id,
        date_sent: time,

        attachments: [
          attach
        ]
      }});

      message = Message.create({
        chat_dialog_id: dialog_id,
        date_sent: time,
        attachment: attach,
        sender_id: User.contact.id
      });
      if (QMCONFIG.debug) console.log(message);
      if (type === 'chat') MessageView.addItem(message, true, true);

      if (dialogItem.length > 0) {
        copyDialogItem = dialogItem.clone();
        dialogItem.remove();
        $('#recentList ul').prepend(copyDialogItem);
        if (!$('#searchList').is(':visible')) {
          $('#recentList').removeClass('is-hidden');
          isSectionEmpty($('#recentList ul'));
        }
      }
    }

  };  

  /* Private
  ---------------------------------------------------------------------- */
  function fixScroll() {
    var chat = $('.l-chat:visible'),
        containerHeight = chat.find('.l-chat-content .mCSB_container').height(),
        chatContentHeight = chat.find('.l-chat-content').height(),
        draggerContainerHeight = chat.find('.l-chat-content .mCSB_draggerContainer').height(),
        draggerHeight = chat.find('.l-chat-content .mCSB_dragger').height();

    chat.find('.l-chat-content .mCSB_container').css({top: chatContentHeight - containerHeight + 'px'});
    chat.find('.l-chat-content .mCSB_dragger').css({top: draggerContainerHeight - draggerHeight + 'px'});
  }

  function isSectionEmpty(list) {
    if (list.contents().length === 0)
      list.parent().addClass('is-hidden');

    if ($('#historyList ul').contents().length === 0)
        $('#historyList ul').parent().addClass('is-hidden');

    if ($('#requestsList').is('.is-hidden') &&
        $('#recentList').is('.is-hidden') &&
        $('#historyList').is('.is-hidden')) {
      
      $('#emptyList').removeClass('is-hidden');
    }
  }

  return AttachView;

});
