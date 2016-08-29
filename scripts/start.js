process.env.NODE_ENV = 'development';

var path = require('path');

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var chalk = require('chalk');
var execSync = require('child_process').execSync;
var opn = require('opn');
var detect = require('./utils/detectPort');
var prompt = require('./utils/prompt');

//internal socket chat constants
var Constants = require('../src/constants/Constants');

// Tools like Cloud9 rely on this
var DEFAULT_PORT = process.env.PORT || 8080;
var compiler;

//var numUsers = 0;
var users = [];

io.on('connection', (socket) => { 
  console.log('new socket connection'); 

  var addedUser = false;

  socket.on(Constants.Sockets.Events.Message, data => {
    console.log(socket.username + ' send a message!');

    socket.broadcast.emit(Constants.Sockets.Events.Message, data);
  });

  socket.on(Constants.Sockets.Events.AddUser, username => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    //++numUsers;
    users.push(username);
    addedUser = true;

    socket.emit(Constants.Sockets.Events.Login, {
      //numUsers: numUsers
      numUsers: users.length,
      users: users
    });

    // echo globally (all clients) that a person has connected
    socket.broadcast.emit(Constants.Sockets.Events.Joiner, {
      username: socket.username,
      numUsers: users.length,
      users: users
      //numUsers: numUsers
    });

    // when the client emits 'typing' we broadcast it to the others
    socket.on(Constants.Sockets.Events.StartTyping, () => {
      console.log(socket.username + ' is typing...');
  
      socket.broadcast.emit(Constants.Sockets.Events.StartTyping, {
        username: socket.username
      });
    });

    // when the client emits 'stop typing' we broadcast it to the others
    socket.on(Constants.Sockets.Events.EndTyping, () => {
      console.log(socket.username + ' is no longer typing...');

      socket.broadcast.emit(Constants.Sockets.Events.EndTyping, {
        username: socket.username
      });
    });

    // when the user disconnects... remove them from the session
    socket.on(Constants.Sockets.Events.Disconnect, () => {
      if (addedUser) {
        //--numUsers;
        users = users.filter(function(el) { return el !== socket.username });
        // echo globally that this client has left the building
        socket.broadcast.emit(Constants.Sockets.Events.Leaver, {
          username: socket.username,
          numUsers: users.length,
          users: users
          //numUsers: numUsers
        });
      }
    });
  });
});

http.listen(3000, () => { 
  console.log('server listening on 3000'); 
});

// TODO: hide this behind a flag and eliminate dead code on eject.
// This shouldn't be exposed to the user.
var handleCompile;
var isSmokeTest = process.argv.some(arg => arg.indexOf('--smoke-test') > -1);

if (isSmokeTest) {
  handleCompile = function (err, stats) {
    if (err || stats.hasErrors() || stats.hasWarnings()) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  };
}

var friendlySyntaxErrorLabel = 'Syntax error:';

function isLikelyASyntaxError(message) {
  return message.indexOf(friendlySyntaxErrorLabel) !== -1;
}

// This is a little hacky.
// It would be easier if webpack provided a rich error object.

function formatMessage(message) {
  return message
    // Make some common errors shorter:
    .replace(
      // Babel syntax error
      'Module build failed: SyntaxError:',
      friendlySyntaxErrorLabel
    )
    .replace(
      // Webpack file not found error
      /Module not found: Error: Cannot resolve 'file' or 'directory'/,
      'Module not found:'
    )
    // Internal stacks are generally useless so we strip them
    .replace(/^\s*at\s.*:\d+:\d+[\s\)]*\n/gm, '') // at ... ...:x:y
    // Webpack loader names obscure CSS filenames
    .replace('./~/css-loader!./~/postcss-loader!', '');
}

function clearConsole() {
  process.stdout.write('\x1bc');
}

function setupCompiler(port, config, webpack) {
  compiler = webpack(config, handleCompile);

  compiler.plugin('invalid', function() {
    clearConsole();
    console.log('Compiling...');
  });

  compiler.plugin('done', function(stats) {
    clearConsole();
    var hasErrors = stats.hasErrors();
    var hasWarnings = stats.hasWarnings();
    if (!hasErrors && !hasWarnings) {
      console.log(chalk.green('Compiled successfully!'));
      console.log();
      console.log('The app is running at http://localhost:' + port + '/');
      console.log();
      return;
    }

    var json = stats.toJson();
    var formattedErrors = json.errors.map(message =>
      'Error in ' + formatMessage(message)
    );
    var formattedWarnings = json.warnings.map(message =>
      'Warning in ' + formatMessage(message)
    );

    if (hasErrors) {
      console.log(chalk.red('Failed to compile.'));
      console.log();
      if (formattedErrors.some(isLikelyASyntaxError)) {
        // If there are any syntax errors, show just them.
        // This prevents a confusing ESLint parsing error
        // preceding a much more useful Babel syntax error.
        formattedErrors = formattedErrors.filter(isLikelyASyntaxError);
      }
      formattedErrors.forEach(message => {
        console.log(message);
        console.log();
      });
      // If errors exist, ignore warnings.
      return;
    }

    if (hasWarnings) {
      console.log(chalk.yellow('Compiled with warnings.'));
      console.log();
      formattedWarnings.forEach(message => {
        console.log(message);
        console.log();
      });

      console.log('You may use special comments to disable some warnings.');
      console.log('Use ' + chalk.yellow('// eslint-disable-next-line') + ' to ignore the next line.');
      console.log('Use ' + chalk.yellow('/* eslint-disable */') + ' to ignore all warnings in a file.');
    }
  });
}

function openBrowser(port) {
  if (process.platform === 'darwin') {
    try {
      // Try our best to reuse existing tab
      // on OS X Google Chrome with AppleScript
      execSync('ps cax | grep "Google Chrome"');
      execSync(
        'osascript ' +
        path.resolve(__dirname, './utils/chrome.applescript') +
        ' http://localhost:' + port + '/'
      );
      return;
    } catch (err) {
      // Ignore errors.
    }
  }
  // Fallback to opn
  // (It will always open new tab)
  opn('http://localhost:' + port + '/');
}

function runDevServer(port, config) {
  const WebpackDevServer = require('webpack-dev-server');
  //const webpackConfig = require('./webpack.config.js');

  new WebpackDevServer(compiler, {
    historyApiFallback: true,
    hot: true,
    quiet: true,
    publicPath: config.output.publicPath,
    stats: { colors: true },
    proxy: { '*': 'http://localhost:3000' },
    watchOptions: {
      ignored: /node_modules/
    }
  }).listen(port, 'localhost', err => {
    if (err)  { 
      console.log(err);
    }
  
    clearConsole();
    console.log(chalk.cyan('Starting the development server...'));
    console.log();
    openBrowser(port);
  });
}

function run(port) {
  const webpack = require('webpack');
  const config = require('../config/webpack.config.dev');
  
  setupCompiler(port, config, webpack);
  runDevServer(port, config);
}

detect(DEFAULT_PORT).then(port => {
  if (port === DEFAULT_PORT) {
    run(port);
    return;
  }

  clearConsole();
  var question =
    chalk.yellow('Something is already running at port ' + DEFAULT_PORT + '.') +
    '\n\nWould you like to run the app at another port instead?';

  prompt(question, true).then(shouldChangePort => {
    if (shouldChangePort) {
      run(port);
    }
  });
});
