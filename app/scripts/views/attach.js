/*
 * Q-municate chat application
 *
 * Attach View Module
 *
 */

define(['jquery', 'config', 'quickblox', 'Helpers', 'LocationView', 'underscore', 'progressbar'], function($, QMCONFIG, QB, Helpers, Location, _, ProgressBar) {

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
          html += '<span class="message-avatar request-button_pending"></span>';
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
        html += '<span class="message-avatar request-button_attach">';
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

      if (fileSize <= 5 * 1024 * 1024)
        time = 50;
      else if (fileSize > 5 * 1024 * 1024)
        time = 60;
      else if (fileSize > 6 * 1024 * 1024)
        time = 70;
      else if (fileSize > 7 * 1024 * 1024)
        time = 80;
      else if (fileSize > 8 * 1024 * 1024)
        time = 90;
      else if (fileSize > 9 * 1024 * 1024)
        time = 100;

      setPercent();

      Helpers.log('File:', file);

      Attach.upload(file, function(blob) {
        Helpers.log('Blob:', blob);

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
          if (percent > 95) return false;
          setTimeout(setPercent, time);
        }
      }
    },

    cancel: function(objDom) {
      objDom.parents('article').remove();
    },

    sendMessage: function(chat, blob, size, mapCoords) {
      var MessageView = this.app.views.Message,
          jid = chat.data('jid'),
          id = chat.data('id'),
          dialog_id = chat.data('dialog'),
          time = Math.floor(Date.now() / 1000),
          type = chat.is('.is-group') ? 'groupchat' : 'chat',
          dialogItem = type === 'groupchat' ? $('.l-list-wrap section:not(#searchList) .dialog-item[data-dialog="'+dialog_id+'"]') : $('.l-list-wrap section:not(#searchList) .dialog-item[data-id="'+id+'"]'),
          locationIsActive = $('.j-send_location').hasClass('btn_active'),
          copyDialogItem,
          lastMessage,
          message,
          attach,
          msg;

      if (mapCoords) {
        attach = {
          'type': 'location',
          'lat' : mapCoords.lat,
          'lng' : mapCoords.lng
        };
      } else {
        attach = Attach.create(blob, size);
      }

      msg = {
        'type': type,
        'body': 'Attachment',
        'extension': {
          'save_to_history': 1,
          'dialog_id': dialog_id,
          'date_sent': time,
          'attachments': [
            attach
          ]
        },
        'markable': 1
      };

      if(locationIsActive) {
        msg.extension.latitude = localStorage['QM.latitude'];
        msg.extension.longitude = localStorage['QM.longitude'];
      }

      QB.chat.send(jid, msg);

      message = Message.create({
        'chat_dialog_id': dialog_id,
        'date_sent': time,
        'attachment': attach,
        'sender_id': User.contact.id,
        'latitude': localStorage['QM.latitude'] || null,
        'longitude': localStorage['QM.longitude'] || null,
        '_id': msg.id
      });

      Helpers.log(message);
      if (type === 'chat') {
        lastMessage = chat.find('article[data-type="message"]').last();
        
        message.stack = Message.isStack(true, message, lastMessage);
        MessageView.addItem(message, true, true);
      }

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
