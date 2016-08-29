/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var FADE_TIME = 150; // ms
	var TYPING_TIMER_LENGTH = 400; // ms
	var COLORS = ['#e21400', '#91580f', '#f8a700', '#f78b00', '#58dc00', '#287b00', '#a8f07a', '#4ae8c4', '#3b88eb', '#3824aa', '#a700ff', '#d300e7'];

	// Initialize variables
	var usernameInput = void 0; // Input for username
	var messagesHolder = void 0; // Messages area
	var inputMessage = void 0; // Input message input box

	var loginPage = void 0; // The login page
	var chatPage = void 0; // The chatroom page

	// Prompt for setting a username
	var username = void 0;
	var connected = false;
	var typing = false;
	var lastTypingTime = void 0;
	var currentInput = void 0;

	var socket = io();

	function getParticipantsMessage(amount) {
	  return amount > 1 ? 'there are ' + amount + ' participants' : 'there\'s 1 participant';
	}

	function addParticipantsMessage(data) {
	  var message = getParticipantsMessage(data.numUsers);

	  log(message);
	}

	// Sets the client's username
	function setUsername() {
	  username = cleanInput(usernameInput.value.trim());

	  // If the username is valid
	  if (username) {
	    loginPage.style.display = 'none';
	    chatPage.style.display = '';

	    // loginPage.off('click');
	    inputMessage.focus();

	    // Tell the server your username
	    socket.emit('add user', username);
	  }
	}

	// Sends a chat message
	function sendMessage() {
	  var message = inputMessage.value;

	  // Prevent markup from being injected into the message
	  message = cleanInput(message);

	  // if there is a non-empty message and a socket connection
	  if (message && connected) {
	    inputMessage.value = '';

	    addChatMessage({
	      username: username,
	      message: message
	    });

	    // tell server to execute 'new message' and send along one parameter
	    socket.emit('new message', message);
	  }
	}

	// Log a message
	function log(message, options) {
	  var el = document.createElement('span');
	  el.className = 'ms-ListItem-primaryText';
	  el.innerText = message;

	  addMessageElement(el, options);
	}

	function getPrettyDate(time) {
	  var date = new Date((time || "").replace(/-/g, "/").replace(/[TZ]/g, " "));
	  var diff = (new Date().getTime() - date.getTime()) / 1000;
	  var day_diff = Math.floor(diff / 86400);

	  // return date for anything greater than a day
	  if (isNaN(day_diff) || day_diff < 0 || day_diff > 0) return date.getDate() + " " + date.toDateString().split(" ")[1];

	  return day_diff == 0 && (diff < 60 && "just now" || diff < 120 && "1 minute ago" || diff < 3600 && Math.floor(diff / 60) + " minutes ago" || diff < 7200 && "1 hour ago" || diff < 86400 && Math.floor(diff / 3600) + " hours ago") || day_diff == 1 && "Yesterday" || day_diff < 7 && day_diff + " days ago" || day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago";
	}

	// Adds the visual chat message to the message list
	function addChatMessage(data, options) {
	  // Don't fade the message in if there is an 'X was typing'
	  var typingMessages = getTypingMessages(data);

	  options = options || {};

	  if (typingMessages.length !== 0) {
	    options.fade = false;

	    typingMessages.forEach(function (typing) {
	      typing.parentNode.removeChild(typing);
	    });
	  }

	  var usernameInfo = document.createElement('span');
	  usernameInfo.className = 'username ms-ListItem-primaryText';
	  usernameInfo.innerText = data.username;
	  usernameInfo.style.color = getUsernameColor(data.username);

	  var messageBody = document.createElement('span');
	  messageBody.className = 'messageBody ms-ListItem-secondaryText';
	  messageBody.innerText = data.message;

	  var messageDateTime = new Date().toISOString();

	  var dateStamp = document.createElement('span');
	  dateStamp.className = 'ms-ListItem-metaText prettyDateTime';
	  dateStamp.dataset.datetime = messageDateTime;
	  dateStamp.innerText = getPrettyDate(messageDateTime);

	  var typingClass = data.typing ? 'typing' : '';

	  var messageHolder = document.createElement('div');
	  messageHolder.className = 'ms-ListItem is-selectable message ' + typingClass;
	  messageHolder.dataset.username = data.username;
	  messageHolder.appendChild(usernameInfo);
	  messageHolder.appendChild(messageBody);
	  messageHolder.appendChild(dateStamp);

	  addMessageElement(messageHolder, options);
	}

	// Adds the visual chat typing message
	function addChatTyping(data) {
	  data.typing = true;
	  data.message = 'is typing...';

	  addChatMessage(data);
	}

	// Removes the visual chat typing message
	function removeChatTyping(data) {
	  var typings = getTypingMessages(data);
	  typings.forEach(function (el) {
	    el.className = 'animated fadeOut';

	    setTimeout(function () {
	      el.parentNode.removeChild(el);
	    }, 1000);
	  });
	}

	// Adds a message element to the messages and scrolls to the bottom
	// el - The element to add as a message
	// options.fade - If the element should fade-in (default = true)
	// options.prepend - If the element should prepend
	//   all other messages (default = false)
	function addMessageElement(el, options) {
	  // Setup default options
	  options = options || {};

	  if (typeof options.fade === 'undefined') {
	    options.fade = true;
	  }

	  if (typeof options.prepend === 'undefined') {
	    options.prepend = false;
	  }

	  // Apply options
	  if (options.fade) {
	    var classes = el.className;

	    el.className = classes + ' hidden';
	    el.className = classes + ' animated fadeIn';
	  }

	  if (options.prepend) {
	    messagesHolder.insertBefore(el, messagesHolder.firstChild);
	  } else {
	    messagesHolder.appendChild(el);
	  }

	  messagesHolder.firstChild.scrollTop = messagesHolder.firstChild.scrollHeight;
	}

	// Prevents input from having injected markup
	function cleanInput(input) {
	  var clean = document.createElement('div');
	  clean.innerText = input;

	  return clean.innerText;
	}

	// Updates the typing event
	function updateTyping() {
	  if (connected) {
	    if (!typing) {
	      typing = true;
	      socket.emit('typing');
	    }

	    lastTypingTime = new Date().getTime();

	    setTimeout(function () {
	      var typingTimer = new Date().getTime();
	      var timeDiff = typingTimer - lastTypingTime;

	      if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
	        socket.emit('stop typing');
	        typing = false;
	      }
	    }, TYPING_TIMER_LENGTH);
	  }
	}

	// Gets the 'X is typing' messages of a user
	function getTypingMessages(data) {
	  var messageCollection = document.querySelectorAll('.typing.message');

	  return [].slice.call(messageCollection).filter(function (el, i) {
	    return el.dataset.username === data.username;
	  });
	}

	// Gets the color of a username through our hash function
	function getUsernameColor(username) {
	  // Compute hash code
	  var hash = 7;

	  for (var i = 0; i < username.length; i++) {
	    hash = username.charCodeAt(i) + (hash << 5) - hash;
	  }

	  // Calculate color
	  var index = Math.abs(hash % COLORS.length);

	  return COLORS[index];
	}

	function hideLoginPageSection() {
	  var login = document.querySelector('.page.login');
	  var messager = document.querySelector('.page.chat');

	  messager.className = 'chat page animated fadeIn';
	  login.className = 'login page ms-Grid-row animated fadeOut';
	}

	var Chat = function (_React$Component) {
	  _inherits(Chat, _React$Component);

	  function Chat(props) {
	    _classCallCheck(this, Chat);

	    return _possibleConstructorReturn(this, Object.getPrototypeOf(Chat).call(this, props));
	  }

	  _createClass(Chat, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      usernameInput = document.querySelector('.usernameInput');
	      messagesHolder = document.querySelector('.messages');
	      inputMessage = document.querySelector('.inputMessage');
	      loginPage = document.querySelector('.login.page');
	      chatPage = document.querySelector('.chat.page');
	      usernameInput.focus();

	      this.initiateSockets();
	      this.updateTimeStamps();
	    }
	  }, {
	    key: 'updateTimeStamps',
	    value: function updateTimeStamps() {
	      // every five minutes update the time stamps
	      var stampInterval = setInterval(function () {
	        [].slice.call(document.querySelectorAll('.prettyDateTime')).forEach(function (d, i) {
	          d.innerText = getPrettyDate(d.dataset.datetime);
	        });
	      }, 300000);
	    }

	    // Socket events

	  }, {
	    key: 'initiateSockets',
	    value: function initiateSockets() {
	      // Whenever the server emits 'login', log the login message
	      socket.on('login', function (data) {
	        connected = true;
	        // Display the welcome message
	        var message = 'Welcome to Ask the Experts – ';

	        log(message, { prepend: true });

	        addParticipantsMessage(data);
	        hideLoginPageSection();
	      });

	      // Whenever the server emits 'new message', update the chat body
	      socket.on('new message', function (data) {
	        addChatMessage(data);
	      });

	      // Whenever the server emits 'user joined', log it in the chat body
	      socket.on('user joined', function (data) {
	        log(data.username + ' joined');

	        addParticipantsMessage(data);
	      });

	      // Whenever the server emits 'user left', log it in the chat body
	      socket.on('user left', function (data) {
	        log(data.username + ' left');

	        addParticipantsMessage(data);
	        removeChatTyping(data);
	      });

	      // Whenever the server emits 'typing', show the typing message
	      socket.on('typing', function (data) {
	        addChatTyping(data);
	      });

	      // Whenever the server emits 'stop typing', kill the typing message
	      socket.on('stop typing', function (data) {
	        removeChatTyping(data);
	      });
	    }
	  }, {
	    key: 'onKeyDown',
	    value: function onKeyDown(event) {
	      // When the client hits ENTER on their keyboard
	      if (event.which === 13) {
	        var type = event.currentTarget.className.replace(' ms-SearchBox-field', '');

	        if (type.toLowerCase() === 'inputmessage') {
	          sendMessage();

	          socket.emit('stop typing');
	          typing = false;
	        } else {
	          setUsername();
	        }
	      }
	    }
	  }, {
	    key: 'onClickFocus',
	    value: function onClickFocus(event) {
	      // Focus input when clicking on the message input's border
	      event.currentTarget.focus();
	    }
	  }, {
	    key: 'onInput',
	    value: function onInput() {
	      updateTyping();
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      return React.createElement(
	        'div',
	        { className: 'ms-Grid' },
	        React.createElement('div', { className: 'messages' }),
	        React.createElement(
	          'div',
	          { className: 'chat page animated fadeOut' },
	          React.createElement(
	            'div',
	            { className: 'ms-Callout ms-Callout--arrowLeft' },
	            React.createElement(
	              'div',
	              { className: 'ms-Callout-main' },
	              React.createElement(
	                'div',
	                { className: 'ms-Callout-header' },
	                React.createElement(
	                  'p',
	                  { className: 'ms-Callout-title' },
	                  'Message me up!'
	                )
	              ),
	              React.createElement(
	                'div',
	                { className: 'ms-Callout-inner' },
	                React.createElement(
	                  'div',
	                  { className: 'ms-Callout-content' },
	                  React.createElement(
	                    'div',
	                    { className: 'ms-SearchBox' },
	                    React.createElement('input', {
	                      className: 'inputMessage ms-SearchBox-field',
	                      onClick: this.onClickFocus.bind(this),
	                      onInput: this.onInput.bind(this),
	                      onKeyDown: this.onKeyDown.bind(this),
	                      placeholder: 'Enter your message...' })
	                  )
	                )
	              )
	            )
	          )
	        ),
	        React.createElement(
	          'div',
	          { className: 'login page ms-Grid-row animated fadeIn' },
	          React.createElement(
	            'div',
	            { className: 'ms-ListItem' },
	            React.createElement(
	              'span',
	              { className: 'ms-ListItem-primaryText' },
	              'What\'s your nickname?'
	            ),
	            React.createElement(
	              'div',
	              { className: 'ms-SearchBox' },
	              React.createElement('input', {
	                className: 'usernameInput ms-SearchBox-field',
	                onClick: this.onClickFocus.bind(this),
	                onKeyDown: this.onKeyDown.bind(this),
	                type: 'text',
	                maxLength: '14' })
	            )
	          )
	        )
	      );
	    }
	  }]);

	  return Chat;
	}(React.Component);

	exports.default = Chat;


	ReactDOM.render(React.createElement(Chat, null), document.getElementById('container'));

/***/ }
/******/ ]);