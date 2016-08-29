import React from 'react';
import Colours from '../ui/colours.js';
import ChatActions from '../actions/ChatActions';
import Constants from '../constants/Constants';
import SharedUtils from '../utils/shared';
import Textarea from 'react-expanding-textarea';
import Styles from '../style.css';

function getInitialState() {
  return {
    username: null
  };
}

export default class Entry extends React.Component {
  constructor(props) {
    super(props);

    Object.keys(this.props).forEach(key => {
      this[key] = this.props[key];
    });

    this.typing = false;
    this.utils = new SharedUtils();
    this.state = getInitialState();
    this.interval = null;
  }

  componentWillReceiveProps(props) {
    this.setState({username: props.username});
  }

  setTypingStatus = () => {
    if (this.socket.connected) {
      let lastTypingTime = (new Date()).getTime();

      if (!this.typing) {
        this.typing = true;

        this.socket.emit(Constants.Sockets.Events.StartTyping, this.state.username);

        this.interval = setInterval(() => {
          const timeDiff = (new Date()).getTime() - lastTypingTime;

          if ((timeDiff > Constants.Sockets.Timings.Typings) && this.typing) {
            this.typing = false;

            this.socket.emit(Constants.Sockets.Events.EndTyping, this.state.username);

            clearInterval(this.interval);
          }
        }, Constants.Sockets.Timings.Typings);
      }
    }
  }

  onClickFocus = event => {
    // Focus input when clicking on the message input's border
    event.currentTarget.focus();
  }

  onInput = () => {
    this.setTypingStatus();
  }

  onKeyDown = event => {
    if (event.which === 13 && !event.ctrlKey) {
      const message = {
        username: this.props.username,
        message: event.currentTarget.value.replace(/\r?\n/g, '<br />'),
        prettydate: this.utils.getPrettyDate(new Date().toISOString()), 
        date: new Date().toISOString()
      };

      this.socket.emit(Constants.Sockets.Events.Message, message);

      const actions = new ChatActions();
      actions.addMessage(message);

      event.currentTarget.value = '';
    } else if (event.which === 13 && event.ctrlKey) {
      event.currentTarget.value += '\n';
    }
  }

  getEntryInputBoxField = () => {
    if (this.state.username) {
      const colour = new Colours();

      return (
        <Textarea
          rows="1"
          maxLength="3000"
          className="inputMessage textarea"
          placeholder="Enter your message..."
          onChange={this.onInput.bind(this)}
          onKeyDown={this.onKeyDown.bind(this)}
          style={{borderColor: colour.getUsernameColour(this.state.username)}} />
      );
      /*return (
        <div className="ms-SearchBox">
          <input 
            className="inputMessage ms-SearchBox-field" 
            onClick={this.onClickFocus.bind(this)} 
            onInput={this.onInput.bind(this)} 
            onKeyDown={this.onKeyDown.bind(this)} 
            placeholder="Enter your message..." />
        </div>
      );*/
     }
  }

  render() {
    const animationActionClass = this.state.username ? 'fadeIn' : 'fadeOut';

    return (
      <div className={`chat page animated ${animationActionClass}`}>
        {this.getEntryInputBoxField()}
      </div>
    );
  }
}
