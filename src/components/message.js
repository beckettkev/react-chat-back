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
    const messages = chatInformation.Thread.Messages.sort(function(a,b){return a.date-b.date});

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

  isBrightEnough = (colour) => {
    const c = colour.substring(1);      // strip #
    const rgb = parseInt(c, 16);   // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff;  // extract red
    const g = (rgb >>  8) & 0xff;  // extract green
    const b = (rgb >>  0) & 0xff;  // extract blue

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

    if (luma < 100) {
        return false;
    } else {
        return true;
    }
  }

  getUsernameColourStyle(username) {
    const colours = new Colours();
    const backgroundColour = colours.getUsernameColour(username);
    const fontColour = this.isBrightEnough(backgroundColour) ? '#000000' : '#FFFFFF';

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

  writeTyping = username => {
    return (
      <div 
         className={`ms-ListItem message typing animated flipInX`} 
         data-username={username}>
           <span className="username ms-ListItem-primaryText" style={this.getUsernameColourStyle(username)}>
             {username} is typing... 
           </span>
      </div> 
    );   
  }

  writeMessage = (data, i) => {
    const arrow = this.arrowDecider(i);

    return (
       <div className={`ms-Callout ms-Callout--arrow${arrow}`}>
        <div className="ms-Callout-main">
          <div className="ms-Callout-header username" style={this.getUsernameColourStyle(data.username)}>
            {data.username}
          </div>
          <div className="ms-Callout-inner">
            <div className="ms-Callout-content">
              <p className="ms-Callout-subText ms-Callout-subText--s" dangerouslySetInnerHTML={{__html: cleanDirtyMessage(data.message)}}></p>
              <span className="ms-ListItem-metaText prettyDateTime" data-datetime={data.date}>
                {this.utils.getPrettyDate(data.date)}
              </span>
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
          {this.state.typings.map(this.writeTyping)}
          {this.state.messages.map(this.writeMessage)}
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