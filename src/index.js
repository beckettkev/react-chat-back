import React from 'react';
import ReactDOM from 'react-dom';
import Chat from './chat';
import io from 'socket.io-client';
import './style.css';

const socket = io.connect('http://localhost:3000');

ReactDOM.render(
  <Chat socket={socket} />,
  document.getElementById('container')
);
