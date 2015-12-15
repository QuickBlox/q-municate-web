
# Q-municate 
Q-municate is an open source code chat application with wide range of communication features available (such as one-to-one messaging, group chat messaging, file transfers, Facebook signup and audio/video calls). http://q-municate.com/

We are please to present you with an out of the box chat application. You can customize this application depending of your needs. QuickBlox is used for the backend http://quickblox.com

Find the source code and more information about Q-municate in our Developers section: http://quickblox.com/developers/q-municate

# Q-municate Web
This description was written by the QuickBlox Web team in order to fully explain how you can build a communication javascript app with the Quickblox API.

Q-municate is designed for all developers, including beginners, as we move from simple to more complex implementation. 
Enjoy and please get in touch if you need any assistance.

## Software Environment
*	The web component is based on the QuickBlox platform
*	The user interface is in English
*	No crashes or exceptions are allowed
* The app immediately reacts to any user action or give notifications about each action which requires time to be processed
* User information is kept safely and securely.
* User's password is encoded and kept in the local storage.
* The App should work correctly in the following browsers:
   - Chrome 13+
   - Firefox 4+
   - Opera 17+
   - Safari 6.1+ (without audio, video calls)  
   - IE 10+ (without audio, video calls)

Q-municate is a fully fledged chat application using the Quickblox API.

## Q-municate application uses the following QuickBlox modules:
* [Chat (v 2.0.)](http://quickblox.com/modules/chat)
* [Users](http://quickblox.com/modules/users/)
* [Content](http://quickblox.com/modules/content/) 
* [WebRTC calling](http://quickblox.com/modules/video-calling/)


Please note, in order to start using Chat 2.0, you should read the [following.](http://quickblox.com/developers/Chat#Pre-Requirements)

## It includes features such as:

1. [Welcome page](#1-welcome-page)
2. [Sign up page (with QM account)](#2-sign-up-page-with-qm-account)
3. [Sign up with Facebook](#3-sign-up-with-facebook)
4. [Log in page (with QM account)](#4-log-in-page-with-qm-account)
5. [Main page](#5-main-page)
6. [Contact list](#6-contact-list)
7. [Chat page](#7-chat-page)
8. [Group chat page](#8-group-chat-page)
9. [Audio calls (WebRTC)](#9-audio-calls-webrtc)
10. [Video calls (WebRTC)](#10-video-calls-webrtc)
11. [My profile page](#11-my-profile-page)
12. [Сontact profile page](#12-contact-profile-page)
13. [Local Search](#13-local-search)  
14. [Global Search](#14-global-search)
15. [File transfer via chat](#15-file-transfer-via-chat)
16. [Chat emojes](#16-chat-emojes)
17. [Icons and sound on a browser's tab](#17-icons-and-sound-on-a-browsers-tab)
18. [Full screen mode for audio and video calls](#18-full-screen-mode-for-audio-and-video-calls)

Please note all these features are available in the code, so you can customize your app depending on your needs.

## Changelog

### v. 1.0.0 – February 12, 2015
* [Full screen mode for audio and video calls](#18-full-screen-mode-for-audio-and-video-calls)
* Improvements of calls 
* Bug  fixes of the chat session expiration

### v. 0.9 – January 19, 2014
* [My profile page](#11-my-profile-page)
* [Сontact profile page](#12-contact-profile-page)
* Retina icons
* Improvements
* Bug fixes

### v. 0.8 – December 19, 2014
* [Video calls (WebRTC)](#10-video-calls-webrtc)
* [Audio calls (WebRTC)](#9-audio-calls-webrtc)
* Call history
* [Icons and sound on a browser's tab](#17-icons-and-sound-on-a-browsers-tab)
* Bug fixes

### v. 0.7 – November 7, 2014
* Backbone (Core and QB wrapper)
* Backbone (Session, User, Contact modules)
* Backbone (Contact List, Dialog modules)
* Backbone (Message, Attach modules)
* Bug fixes 

### v. 0.6 – September 30, 2014
* Optimization of emoji upload
* Fixed FB SDK asynchronous uploading 
* Fixed cache data uploading from the Local Storage 
* Optimization of css files import 
* Integration of current features with mobile versions 
* Bug fixes 

### v. 0.5 – August 26, 2014
* [Welcome page](#1-welcome-page)
* [Log in page (with QM account)](#4-log-in-page-with-qm-account)
* Forgot password 
* [Sign up with Facebook](#3-sign-up-with-facebook)
* [Log in page (with QM account)](#4-log-in-page-with-qm-account)
* Import friends from Facebook 
* [Main page](#5-main-page)
* [Local Search](#13-local-search)  
* [Global Search](#14-global-search)
* [Contact list](#6-contact-list)
* [Chat page](#7-chat-page)
* [Group chat page](#8-group-chat-page)
* [File transfer via chat](#15-file-transfer-via-chat)
* [Chat emojes](#16-chat-emojes)


## Features list

### 1. Welcome page
When user opens the App, the welcome page is shown.

<img src="http://files.quickblox.com/qm-web_0008_04-1-welcome.png" height="400" />&nbsp;

#### Available features:
##### Buttons:
* Connect with Facebook allows the user to sign up with their Facebook credentials;
* Sign Up with email opens the sign up page;
* 'Already have an account?' opens login page.


### 2. Sign up page (with QM account)
Sign up page allows to create a new QM user.

<img src="http://files.quickblox.com/Sign_Up_Page.png" height="400" />&nbsp;

#### Available features:
#####Fields set:
* Full name – accepts everything except '<', '>' and ';', 3-50 characters; mandatory;
* Email – should look like an email address, 3-255 characters, mandatory;
* Password – accepts everything except non-Latin characters and spaces; 8-40 character; mandatory;
* Choose user picture avatar icon- will be auto filled with selected image, if image is chosen.

##### Buttons:
* Choose user picture – all area and button is clickable. After clicking, user chooses image from the computer, not mandatory; 
* Sign Up: 
  - If all fields are populated correctly, user receives a welcome email and is redirected to the main page.
  - If some fields aren't populated correctly, the user sees the Sign Up Page with the appropriate alert and password field is cleared. The alert depends on what field user has filled in incorrectly;
* User Agreement opens the page http://q-municate.com/agreement/ in a new tab;
* Privacy Policy opens the page http://quickblox.com/privacy/ in a new tap.

##### The code
```javascript
User.prototype.signup = function(params, avatarFile) {
var self = this;

QB.createSession(function(err, session) {
  if (session) {
    Session.create({ token: session.token });

    QB.users.create(params, function(err, newUser) {
      if (newUser) {
        delete params.full_name;
        delete params.tag_list;

        QB.login(params, function(err, user) {
          if (user) {
            Session.update({ date: new Date(), authParams: Session.encrypt(params) });
            chatService.connect(user, function(roster) {
              // callback
              if (avatarFile) self.uploadAvatar(avatarFile);
            });            
          }
        });
      }
    });
  }
});

};

User.prototype.uploadAvatar = function(file) {
var self = this, custom_data;

QB.content.createAndUpload({file: file, 'public': true}, function(err, blob) {
  if (blob) {
    custom_data = JSON.stringify({avatar_url: blob.path});

    QB.users.update(self.id, {blob_id: blob.id, custom_data: custom_data}, function(err, user) {
      // callback
    });
  }
});

};

```


### 3. Sign up with Facebook
Sign Up with Facebook allows to create QM user with the help of Facebook credentials.

<img src="http://files.quickblox.com/Facebook_request.png" height="400" />&nbsp;

#### Available features:
Sign Up with Facebook feature creates a QM user with Facebook credentials. 
<br>
If the user signs up via Facebook, they can’t log in using QM login form. 
<br>
If the user signs up with Facebook - the app will download FB avatar image, full name, and email. Friends who use the App will be imported from the FB account.

<img src="http://files.quickblox.com/Imported_friends_pop_up.png" height="400" />&nbsp;

##### The code
```javascript
FB.login(function(response) {
  if (response.status === 'connected') {
    User.connectFB(response.authResponse.accessToken);
  }
}, {scope: QMCONFIG.fbAccount.scope});

User.prototype.connectFB = function(token) {
var self = this;

QB.createSession({provider: 'facebook', keys: {token: token}}, function(err, session) {
  if (session) {
    Session.create({ token: session.token });

    QB.users.get(session.user_id, function(err, user) {
      if (user) {
        Session.update({ date: new Date(), authParams: Session.encrypt(params) });
        chatService.connect(user, function(roster) {
          self.import(roster);
        });        
      }
    });
  }
});

};

User.prototype.import = function(roster) {
var self = this;
var isFriendsPermission = false;

FB.api('/me/permissions', function (response) {
  response.data.forEach(function(item) {
    if (item.permission === 'user_friends' && item.status === 'granted')
      isFriendsPermission = true;
  });

  if (isFriendsPermission) {
    FB.api('/me/friends', function (friends) {
      var ids = [];
      for (var i = 0, len = friends.data.length; i < len; i++) {
        ids.push(friends.data[i].id);
      }

      if (ids.length > 0)
        dialog.download(roster, ids);
      else
        dialog.download(roster);
    });
  } else {
    dialog.download(roster);
  }

  self.updateQBUser();
});

};

User.prototype.updateQBUser = function() {
var custom_data = JSON.stringify({is_import: '1'});

QB.users.update(this.id, {custom_data: custom_data}, function(err, user) {
  // callback
});

};

```


### 4. Log in page (with QM account)
User can log in the app as a QM user.

<img src="http://files.quickblox.com/Log_In.png" height="400" />&nbsp;

#### Available features:
* Email – text/numeric/symbolic fields 3 chars min - no border, mandatory (email symbols validation included). The user can able to paste their email address in this field if it is currently in clipboard;
* Password – text/numeric/symbolic field 8-40 chars (should contain alphanumeric and punctuation characters only) , mandatory Input symbols are replaced with *, so that the user's password is not visible. The user should be able to paste their password in this field if it is currently in the clipboard;
* Remember me – checkbox is checked by default. Allows the user to save their login data so that he/she doesn't have to enter them again if the user leaves and returns, or refreshes the page. If this checkbox is unchecked, then the user returns to the Main page of the App after refreshing the page or after closing. Login Page is shown again if the user logs out. 

##### Buttons:
* Connect with Facebook button allows the user to sign up with Facebook credentials;
* Log in button allows the user to enter the App:
 - If the user provides valid login credentials, they're is redirected to Main page; 
 - If the user provides incorrect/invalid login credentials (email and password), the App shows Log in page with alert message;
* Forgot password? link redirects the user to the Forgot password page.
 
##### The code
```javascript
User.prototype.login = function(params) {

QB.createSession(params, function(err, session) {
  if (session) {
    Session.create({ token: session.token });

    QB.users.get(session.user_id, function(err, user) {
      if (user) {
        Session.update({ date: new Date(), authParams: Session.encrypt(params) });
        chatService.connect(user, function(roster) {
          // callback
        });        
      }
    });
  }
});

};

```


### 5. Main page
After clicking the QM logo and Q-municate at the top left corner, the user is redirected to the Main page.
<br>
The Main page is displayed a list of user’s contact chats.

<img src="http://files.quickblox.com/Main_page.png" height="400" />&nbsp;

#### Available features:
* All user contacts (online/offline/pending contact request) are displayed in the left panel in 2 sections – Recent and History (the same as in the Chats page). For each contact are shown full name, avatar image and online/offline status. The icons for statuses:
  - Green icon – user is online;
  - Question icon -  pending contact request;
  - No icon -  user is offline. 
* Contacts shown as a scrollable table view;
* Contact is highlighted when hovering;
* The user can click on a contact to open a chat;
* Search field;
* A version of the app is displayed at the bottom of the page;

##### Buttons:
* Search Friends button opens Global Search pop-up;
* Contacts button:
  -	User can create a chat with any contact;
  -	User can create a group chat with any contacts.
* Navigate to user’s profile or log out by clicking on the user at top right corner.

<img src="http://files.quickblox.com/action_popover.png" height="400" />&nbsp;

#### Available features:
* Possible actions after right clicking a contact in the left panel:
  -	Video call – start a video call;
  -	Audio call – start an audio call;
  - Add people – add people to the group chat;
  -	Profile – open a details page;
  -	Delete contact – delete from contacts.

If there is no connection to the internet, an alert message is displayed on the top section. 
<br>
When connection in recovered, the alert message disappears.

<img src="http://files.quickblox.com/Internet_connection_alert.png" height="400" />&nbsp;

##### The code
```javascript
// connect to chat service
ChatService.prototype.connect = function(user, callback) {
var self = this;
var password = Session.token;

QB.chat.connect({jid: self.getUserJid(user), password: password}, function(err, roster) {
  if (roster) {
    Session.update({ date: new Date() });

    // set inner listener functions
    QB.chat.onMessageListener = MessageView.onMessage;
    QB.chat.onContactListListener = ContactListView.onPresence;
    QB.chat.onSubscribeListener = ContactListView.onSubscribe;
    QB.chat.onConfirmSubscribeListener = ContactListView.onConfirm;
    QB.chat.onRejectSubscribeListener = ContactListView.onReject;

    QB.webrtc.onCallListener = VideoChatView.onCall;
    QB.webrtc.onAcceptCallListener = VideoChatView.onAccept;
    QB.webrtc.onRejectCallListener = VideoChatView.onReject;
    QB.webrtc.onStopCallListener = VideoChatView.onStop;
    QB.webrtc.onUpdateCallListener = VideoChatView.onUpdateCall;
    QB.webrtc.onRemoteStreamListener = VideoChatView.onRemoteStream;

    callback(roster);
  }
});

};

// get all dialogs
Dialog.prototype.download = function() {

QB.chat.dialog.list({sort_desc: 'last_message_date_sent'}, function(err, dialogs) {
  if (dialogs) {
    // callback
  }
});

};

```


### 6. Contact list
User can add or delete contacts from their contact list.
<br>
After sending a request, the user sees the following page:

<img src="http://files.quickblox.com/Rejected_contact_request.png" height="400" />&nbsp;

When the user sends a request, they see “Your request has been sent” in the chat section, the contact is marked with “?”. The user is not able to write messages to the contact before accepting a request.

After receiving a request, the user sees the following page:

<img src="http://files.quickblox.com/Contact_request.png" height="400" />&nbsp;

##### Buttons:
   - Tick icon adds new contact to user’s contact list; 
   - Cross icon rejects the contact request.

##### The code
```javascript
// send subscribe request
var time = Math.floor(Date.now() / 1000;
QB.chat.roster.add(jid, function() {
  QB.chat.send(jid, {type: 'chat', body: 'Contact request', extension: {
    save_to_history: 1,
    date_sent: time,
    notification_type: '4'
  }});
});

// send confirm answer
QB.chat.roster.confirm(jid, function() {
  QB.chat.send(jid, {type: 'chat', body: 'Contact request', extension: {
    save_to_history: 1,
    date_sent: time,
    notification_type: '5'
  }});
});

// send reject answer
QB.chat.roster.reject(jid, function() {
  QB.chat.send(jid, {type: 'chat', body: 'Contact request', extension: {
    save_to_history: 1,
    date_sent: time,
    notification_type: '6'
  }});
});

// delete a contact
QB.chat.roster.remove(jid, function() {
  QB.chat.send(jid, {type: 'chat', body: 'Contact request', extension: {
    save_to_history: 1,
    date_sent: time,
    notification_type: '7'
  }});
});

```


### 7. Chat page
User can chat with all contacts from their contact list.

<img src="http://files.quickblox.com/Chats_page.png" height="400" />&nbsp;

#### Available features:
After opening a private (one-to-one) chat, the user sees last 50 messages. He can open older history (till the first message) by scrolling.
<br>
Messages are sent after pressing Enter button.
<br>
If the user has chats with unread messages, these chats are displayed with a counter of the unread messages on the right.
The recent section displays contacts with whom the user has recently interacted with (within the last day).
##### Buttons:
* The phone icon starts an audio call;
* The video icon starts a video call;
* The plus icon allows to add contacts to a group chat;
* The profile icon opens contact’s details page;
* The delete icon opens a pop-up and allows to delete a contact from the contact list;
* The smile icon opens chat Emojes;
* The attachment icon allows to add files from the computer.

##### The code
```javascript
// create a private dialog
QB.chat.dialog.create({type: 3, occupants_ids: id}, function(err, dialog) {
  if (dialog) {
    // callback
  }
});

// get all messages for dialog
Message.prototype.download = function(dialog_id, count) {
  var params = {chat_dialog_id: dialog_id, sort_desc: 'date_sent', limit: 50, skip: count || 0};
  QB.chat.message.list(params, function(err, messages) {
    if (messages) {
      // callback
    }
  });
};

// send message
Message.prototype.send = function(value) {
  QB.chat.send(jid, {type: 'chat', body: value, extension: {
    save_to_history: 1,
    date_sent: Math.floor(Date.now() / 1000;
  }});
};

```


### 8. Group chat page
Users can create a group chat with any or all of the contacts in their contact list.
<br>
*Each member of the group chat has the same capabilities.*

<img src="http://files.quickblox.com/Group_chat_page_with_edit_icon.png" height="400" />&nbsp;

##### Available features:
* Change a group chat name
* Change a group chat avatar
* Add new contacts to a chat. 
* Leave a chat. 
* Show/hide chat’s members. 
* Start a video/audio call, write a message or open a profile page of any contact in a group chat if this contact is in the contact list. If no - user can send a request to him.
 
##### The code
```javascript
/* on creator side
---------------------------------------*/
// create the group dialog
QB.chat.dialog.create({type: 2, occupants_ids: params.ids, name: params.name}, function(err, dialog) {
  if (dialog) {

    // join to created room
    QB.chat.muc.join(dialog.xmpp_room_jid, function() {
      // send message about added people for history
      QB.chat.send(dialog.room_jid, {type: 'groupchat', body: 'Notification message', extension: {
        save_to_history: 1,
        date_sent: Math.floor(Date.now() / 1000),
        notification_type: '1',
        occupants_ids: dialog.occupants_ids.join()
      }});

      // send notifications about adding people
      for (var i = 0, len = dialog.occupants_ids.length, id, jid; i < len; i++) {
        id = dialog.occupants_ids[i];
        jid = QB.chat.helpers.getUserJid(id, appId); // appId - your QB application ID
 
        QB.chat.send(jid, {type: 'chat', extension: {
          notification_type: '1',
          dialog_id: dialog._id,
          room_jid: dialog.xmpp_room_jid,
          room_name: dialog.name,
          occupants_ids: dialog.occupants_ids.join()
        }});
      }
    });
  }
}); 

/* on recipient side
---------------------------------------*/
// receive a new message
QB.chat.onMessageListener = function(senderId, message) {
  // check if this message is a notification about new room
  if (message.extension && message.extension.notification_type === '1') {
 
    // join to created room
    QB.chat.muc.join(message.extension.room_jid, function() {
      // callback
    })
  } 
};

/* leave a room
---------------------------------------*/
QB.chat.send(dialog.room_jid, {type: 'groupchat', body: 'Notification message', extension: {
  save_to_history: 1,
  date_sent: Math.floor(Date.now() / 1000),
  notification_type: '2',
  deleted_id: User.id
}});

QB.chat.dialog.update(dialog.id, {pull_all: {occupants_ids: [User.id]}}, function(err, dialog) {
  // callback
});

```


### 9. Audio calls (WebRTC)
Any user with a microphone can start an audio call by clicking audio call icon in the chat section. 
<br>
A call is started after allowing the application to use the microphone, and is displayed in the chat section.

<img src="http://files.quickblox.com/Audio_call_page.png" height="400" />&nbsp;

##### Buttons:
* Disable camera – camera is turned off by default. Users cannot start a video call by clicking this icon;
* Mute voice – clicking this icon, user can turn on/off their microphone;
* End call – ends current call and redirects user to the Chats Page.
Colour of the buttons:
- Red – a feature isn’t enabled;
- Black - a feature is enabled.

##### The code
```javascript
// call user
var mediaParams = {
  audio: true,
  video: false,
  elemId: 'localStream',
  options: {
    muted: true
  }
};
QB.webrtc.getUserMedia(mediaParams, function(err, stream) {
  if (stream) {
    QB.webrtc.call(params.opponent_id, 'audio', {
      dialog_id: params.dialogId,
      avatar: User.avatar_url,
      full_name: User.full_name
    });
  }
});

// accept call
QB.webrtc.getUserMedia(mediaParams, function(err, stream) {
  if (stream) {
    QB.webrtc.accept(params.opponent_id, {
      dialog_id: params.dialogId
    });
  }
});

// reject call
QB.webrtc.reject(params.opponent_id, {
  dialog_id: params.dialogId
});

// stop call
QB.webrtc.stop(params.opponent_id, 'manually', {
  dialog_id: params.dialogId
});

```


### 10. Video calls (WebRTC)

<img src="http://files.quickblox.com/call_video.png" height="400" />&nbsp;

#### Available features:

Any user with a webcam and a microphone can start a video call by clicking the video call icon in the chat section. 
 <br>
 A call is started after allowing the application to use the camera and microphone, and is displayed in the chat section.
 <br>
 Call history is displayed in the chat section.
##### Buttons:
* Disable camera – by clicking this icon, the user can turn on/off their camera. If the user hovers over this icon when the camera is disabled, a pop-up saying “Camera is off” is displayed;
* Mute voice – clicking this icon, the user can turn on/off their microphone;
* End call – ends current call and redirects the user to the Chats page.

Colours of the buttons:
* Red – feature is disabled/not allowed;
* Black - feature is enabled.

##### The code
```javascript
// call user
var mediaParams = {
  audio: true,
  video: true,
  elemId: 'localStream',
  options: {
    muted: true,
    mirror: true
  }
};
QB.webrtc.getUserMedia(mediaParams, function(err, stream) {
  if (stream) {
    QB.webrtc.call(params.opponent_id, 'video', {
      dialog_id: params.dialogId,
      avatar: User.avatar_url,
      full_name: User.full_name
    });
  }
});

// mute webcam
QB.webrtc.mute('video');
QB.webrtc.update(params.opponent_id, {
  dialog_id: params.dialogId,
  mute: 'video'
});

// unmute webcam
QB.webrtc.unmute('video');
QB.webrtc.update(params.opponent_id, {
  dialog_id: params.dialogId,
  unmute: 'video'
});

```


### 11. My profile page
The profile page allows the user view and edit their profile info.

<img src="http://files.quickblox.com/Profile_page_with_alert_message.png" height="400" />&nbsp;

#### Fields set:
-	Name – allows everything except '<', '>' and ';', 3-50 characters; mandatory;
-	Email – if the user has a long email, only beginning of an email is displayed (the remaining is hidden by ellipsis);
-	User picture field is filled with the user's current profile photo if an image was chosen while signing up; 
-	Status – text/numeric/symbolic field; 0-80 characters;
-	Phone – numeric/symbolic field; 0-20 characters.

#### Buttons:
* Set Profile Photo – after clicking, the user can choose an image from their computer.
* Change password – after clicking, the user can change their password;
* Add/ Edit status – the user can add or change their status (changes are saved immediately).
* Edit User name – the user can change their user name (changes are saved immediately).
* Connect - allows the user connect their QM account with Facebook account. 

##### The code
```javascript
User.prototype.updateProfile = function(params) {
  QB.users.update(this.id, params, function(err, user) {
    if (user) {
      // callback      
    }
  });
};

```



### 12. Сontact profile page
The details page is used for contacts profile information.

<img src="http://files.quickblox.com/Details_page.png" height="400" />&nbsp;

Contact profile page shows the user’s information:
* Full name. If a name is very long, extra characters are hidden by ellipsis;  
* Status (short text message). The full status is always displayed; 
* Presence (online/offline); 
* Tel. number (if filled). If a number is very long, extra characters are hidden by ellipsis.

#### Buttons:
* Video call button starts a video call with current user;
* Audio call button starts an audio call with current user;
* Message button starts a chat with current user;
* Delete contact opens the Delete user pop-up.

##### The code
```javascript
User.prototype.getContactProfile = function(contactId) {
  QB.users.get(contactId, function(err, user) {
    if (user) {
      // callback      
    }
  });
};

```


### 13. Local Search 
User can use the local search field to find contacts in their contact list.

 <img src="http://files.quickblox.com/Chats_page_with_search.png" height="400" />&nbsp;

The search is started automatically upon inputting characters. Contacts matching the search are displayed in the original order that they were located in, in the contacts list. 

#### Buttons:
* Global Search  - opens the Global search pop-up to find users across the whole app.


### 14. Global Search
User can use the global search to find all users of Q-municate.

<img src="http://files.quickblox.com/Global_Search_pop-up.png" height="400" />&nbsp;

##### Buttons:
* The search field – allows the user input different search criteria;
* “Add” icons – allows the user send a request to any QM user. 

##### The code
```javascript
User.prototype.getContactProfile = function(userName, page) {
  QB.users.get({full_name: userName, page: page}, function(users) {
    if (users) {
      // callback      
    }
  });
};

```


### 15. File transfer via chat
After clicking the 'attach' icon, the user can choose a file from their computer to send. 
User can upload any file type. An attachment is sent automatically after selecting it in the file selection dialog.

<img src="http://files.quickblox.com/File_transfer.png" height="400" />&nbsp;

An attachment is sent as a separate message (it's not possible to send a message with an attachment).
A spinner shows the upload progress.

#### Available features:
* The user can stop uploading by clicking a Cancel button;
* The user can download a file by clicking a Download button;
* The user can play an audio or video file in the chat section;
* The user can open a full image by clicking it in the chat section.
screen

##### The code
```javascript
Message.prototype.attach = function(file) {
var attachment;

QB.content.createAndUpload({file: file, 'public': true}, function(err, blob) {
  if (blob) { 
    attachment = {
        type: type,
        url: blob.path,
        name: blob.name,
        size: blob.size,
        'content-type': blob.content_type
    };

    QB.chat.send(user_jid, {type: 'chat', extension: {
      attachments: [
        attachment
      ]
    }});
  }
});

};

```

### 16. Chat emojis
User can send an emoji by clicking the smile icon. Emojis are divided over 5 pages.

<img src="http://files.quickblox.com/Chat_Emojes.png" height="400" />&nbsp;

### 17. Icons and sound on a browser's tab
The favicon of the Q-municate tab changes with unread messages, and a sound is place upon recieving a message.

<img src="http://files.quickblox.com/Tab_with_unread_messages.png" height="400" />&nbsp;

#### Available features:
If the user recieves a message, but the QM tab isn’t open or a dialog with unread messages isn’t active – the QM tab favicon changes:
* A red dot is added to the QM icon;
* The amount of unread dialogs in brackets is added to the QM tab;
* A sound plays when a message is received.

If the QM tab is active while messages receiving, no actions are taken.

### 18. Full screen mode for audio and video calls
During the audio or video call user can click Extend icon to open a call in a separate window.

<img src="http://files.quickblox.com/fullmode_500x337.png" height="400" />&nbsp;

#### Available features during the call in a separate window:
* Narrow icon – after clicking this icon, a call in narrowed back to the chat section;
* Mute camera – clicking this icon, user can turn on/off his camera (only for video calls);
* Mute voice – clicking this icon, user can turn on/off his microphone (for both audio and video calls);
* End call – ends current call and redirects user to the Chats Page.


### Important - how to build your own Chat app</h3>

If you want to build your own app using Q-municate as a base, please do the following:

 1. Download the project from here (GitHub)
 2. Run <code>sudo npm install -g bower</code> in your terminal
 3. Run <code>sudo gem install compass</code> in your terminal
 4. Run <code>sudo npm install -g grunt-cli</code> in your terminal
 5. Run <code>bower install</code> to install all additional packages in your terminal
 6. Run <code>sudo npm install</code> to install all additional packages in your terminal
 7. [Register a QuickBlox account](http://admin.quickblox.com/register) (if you don't have one yet).
 8. Login to the [QuickBlox admin panel](http://admin.quickblox.com/signin)
 9. Create a new app
 10. Click on the app title in the list to reveal the app's credentials:
   ![App credentials](http://files.quickblox.com/app_credentials.png)
 11. Create Facebook Application for ability connecting via Facebook
 12. Copy the credentials (App ID, Authorization key, Authorization secret) and your Facebook App ID into your Q-municate project code in <code>config.js</code><br />
 13. Run <code>grunt build</code> in your terminal to build Q-municate
 14. Run <code>grunt serve</code> in your terminal to run Q-municate 


### Additional: how to build desktop version
 
 1. Download nw.js dependent to your system(Win, OS X, Linux) [NW.js](http://nwjs.io/).
 2. Add in 'package.json' after 'engines' section next lines:

 ```javascript 
   "window": {
     "toolbar": false,
     "width": 1000,
     "height": 800
   },
   "main": "app/index.html"
   ```
 3. Run: $ /path/to/nw .  (suppose the current directory contains 'package.json'). Read more https://github.com/nwjs/nw.js#quick-start about OS X and Windows
 4. [How to package app](https://github.com/nwjs/nw.js/wiki/How-to-package-and-distribute-your-apps). 
 
# License
Apache License
Version 2.0
