import React from 'react';
import ChatActions from '../actions/ChatActions';
import Constants from '../constants/Constants';

function getInitialState() {
  return {
    display: true
  };
}

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    
    Object.keys(this.props).forEach(key => {
      this[key] = this.props[key];
    });

    this.state = getInitialState();
  }

  componentDidMount = () => {
    const input = document.querySelector('.usernameInput');
    const actions = new ChatActions();

    input.focus();
  }

  setUsername = username => {
    // If the username is valid
    if (username) {
      const actions = new ChatActions();

      this.setState({ display: false });

      // Tell the server your username
      this.socket.emit(Constants.Sockets.Events.AddUser, username);

      this.props.onLoginMember(username);

      //actions.addMember(username);
    }
  }

  onClickFocus = event => {
    // Focus input when clicking on the message input's border
    event.currentTarget.focus();
  }

  onKeyDown = event => {
    if (event.which === 13) {
      const username = event.currentTarget.value;

      this.setUsername(username);
    }
  }

  getLoginInputFormField() {
    if (this.state.display) {
      return (
        <div className="ms-ListItem">
          <span className="ms-ListItem-primaryText">What's your nickname?</span>
          <div className="ms-SearchBox">
            <input
              className="usernameInput ms-SearchBox-field" 
              onClick={this.onClickFocus.bind(this)}
              onKeyDown={this.onKeyDown.bind(this)} 
              type="text" 
              maxLength="14" />
          </div>
        </div>
      );
    }
  }

  render() {
    return (
      <div className="login page ms-Grid-row animated fadeIn">
        {this.getLoginInputFormField()}
      </div>
    );
  }
}
