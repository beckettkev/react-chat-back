import React from 'react';
import Colours from '../ui/colours.js';
import Constants from '../constants/Constants';
import SharedUtils from '../utils/shared';
import ChatActions from '../actions/ChatActions';
import Store from '../stores/Chat';

function getChatState() {
  return {
    Thread: Store.getCurrentMessages(),
    Typings: Store.getCurrentTypings()
  };
}

function getInitialState() {
  return { 
    messages: [], 
    typings: [],
    joiners: [],
    arrow: 'Left'
  };
}

function obfusicationToggleForBreakTags(msg, obfusicate) {
  return obfusicate ? msg.replace(/(<br \/>)/g,'[br /]') : msg.replace(/(\[br \/\])/g,'<br />');
}

function cleanDirtyMessage(msg) {
  let cleaner = obfusicationToggleForBreakTags(msg, true);

  cleaner = cleaner.replace(/(<([^>]+)>)/ig, '');

  return obfusicationToggleForBreakTags(cleaner, false);
}

export default class Message extends React.Component {
  constructor(props) {
    super(props);

    Object.keys(this.props).forEach( key => {
      this[key] = this.props[key];
    });

    this.state = getInitialState();
    this.utils = new SharedUtils();
  }

  componentDidMount = () => {
    const { socket } = this.props;
    const actions = new ChatActions();

    if (this.props.messages) {
      this.updateTimeStamps();
    }

    Store.addChangeListener(this.onChatEvent);

    socket.on(Constants.Sockets.Events.Message, data => {
      actions.addMessage(data);
    });

    socket.on(Constants.Sockets.Events.Joiner, data => {
      this.state.joiners.push(data.username);

      const joined = window.setTimeout(() => {
        this.state.joiners = this.state.joiners.filter(member => member === data.username);
      }, 2000);
    });

    // Whenever the server emits 'typing', show the typing message
    socket.on(Constants.Sockets.Events.StartTyping, data => {
      actions.addMemberTyping(data);
    });

    // Whenever the server emits 'stop typing', kill the typing message
    socket.on(Constants.Sockets.Events.EndTyping, data => {
      actions.removeMemberTyping(data);
    });
  }

  componentWillMount() {
    Store.removeChangeListener(this.onChatEvent);
  }

  onChatEvent = () => {
    const chatInformation = getChatState();
    const messages = chatInformation.Thread.Messages.sort(function(a,b) {return a.date-b.date});

    this.setState({
      messages: messages,
      typings: chatInformation.Typings.Current
    });
  }

  updateTimeStamps() {
    // every five minutes update the time stamps
    setInterval(function() {
      // loop through the node list to get all dates
      [].slice.call(document.querySelectorAll('.prettyDateTime')).forEach(d => {
        d.innerText = this.utils.getPrettyDate(d.dataset.datetime);
      });
    }, Constants.Messages.PrettyDate.RefreshFrequency);
  }

  getUsernameColourStyle(username) {
    const colours = new Colours();
    const backgroundColour = colours.getUsernameColour(username);
    const fontColour = colours.isBrightEnough(backgroundColour) ? '#000000' : '#FFFFFF';

    return {
      backgroundColor: backgroundColour,
      padding: '8px 10px 8px 10px',
      color: fontColour
    };
  }

  arrowDecider = (pos) => {
    const messages = this.state.messages;

    if (pos === 0) {
      return this.state.arrow;
    }

    if (messages[pos-1].username !== messages[pos].username) {
      this.state.arrow = this.state.arrow === 'Left' ? 'Right' : 'Left';
    }
    
    return this.state.arrow;
  }

  getMessageBlock = (message, username) => {
    return (
      <div 
         className={`ms-ListItem message typing animated flipInX`} 
         data-username={username}>
           <span className="username ms-ListItem-primaryText" style={this.getUsernameColourStyle(username)}>
             {message}
           </span>
      </div> 
    );
  }

  writeLatestJoiner = username => {
    return this.getMessageBlock(`${username} has just joined...`, username);
  }

  writeTyping = username => {
    return this.getMessageBlock(`${username} is typing...`, username);
  }

  writeChatMessage = (data, i) => {
    const arrow = this.arrowDecider(i);

    return (
       <div className={`ms-Callout ms-Callout--arrow${arrow}`}>
        <div className="ms-Callout-main">
          <div className="ms-Callout-header username" style={this.getUsernameColourStyle(data.username)}>
            {data.username}
            <span className="prettyDateTime" data-datetime={data.date}>
              @{this.utils.getPrettyDate(data.date)}
            </span>
          </div>
          <div className="ms-Callout-inner">
            <div className="ms-Callout-content">
              <p className="ms-Callout-subText ms-Callout-subText--s" dangerouslySetInnerHTML={{__html: cleanDirtyMessage(data.message)}}></p>
            </div>
          </div>    
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="container">
        <div className="messages">
          {this.state.joiners.map(this.writeLatestJoiner)}
          {this.state.typings.map(this.writeTyping)}
          {this.state.messages.map(this.writeChatMessage)}
        </div>
      </div>
    );
  }
}


/*
       <div 
         className="ms-ListItem message animated flipInX" data-username={data.username}>
           <span className="username ms-ListItem-primaryText" style={this.getUsernameColourStyle(data.username)}>
             {data.username}
           </span>
           <span 
              className="messageBody ms-ListItem-secondaryText" 
              dangerouslySetInnerHTML={{__html: cleanDirtyMessage(data.message)}}>
           </span>
           <span className="ms-ListItem-metaText prettyDateTime" data-datetime={data.date}>
             {this.utils.getPrettyDate(data.date)}
           </span>
       </div> */