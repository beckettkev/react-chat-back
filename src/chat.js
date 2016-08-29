import React from 'react';
import Messages from './components/message';
import Participants from './components/participants';
import Login from './components/login';
import Entry from './components/entry';

function getInitialState() {
  return {
    memberCount: 0,
    username: null
  };
}

export default class Chat extends React.Component {
  constructor(props) {
    super(props);
  
    this.state = getInitialState();
  }

/*
  componentDidMount() {
    if (!this.state) {
      this.setState(getInitialState());
    }
  }
*/

  onLoginMember = member => {
    this.setState({
      memberCount: this.state.memberCount + 1,
      username: member
    });
  }

  render() {
    return (
      <div id="app">

        <Login 
          socket={this.props.socket}
          onLoginMember={this.onLoginMember} />

        <Participants
          socket={this.props.socket} />
                  
        <Messages
          socket={this.props.socket} />

                    
        <Entry 
          socket={this.props.socket}
          username={this.state.username} />

        </div>
     );
  }
}