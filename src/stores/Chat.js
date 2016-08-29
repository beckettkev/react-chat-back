import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import ChatConstants from '../constants/ChatConstants';
import Constants from '../constants/Constants';
import Assign from 'object-assign';

let ChatSession = {
    Open: false,
    Messages: [],
    Typings: [],
    MaxMemberSize: -1,
    Start: null,
    End: null,
};

function addMessage(data) {
  ChatSession.Messages.push(data);
}

function addMemberTyping(member) {
  ChatSession.Typings.push(member.username);
}

function removeMemberTyping(member) {
  ChatSession.Typings = ChatSession.Typings.filter(typer => typer !== member.username);
}

function openChatSession(maximum) {
  ChatSession.Open = true;
  ChatSession.Start = new Date().toISOString();

  if (typeof maximum !== 'undefined') {
    if (maximum !== -1 && typeof maximum === 'number') {
      ChatSession.MaxMemberSize = Number(maximum.toFixed(0));
    }
  }
}

function closeChatSession() {
  ChatSession.Open = false;
  ChatSession.End = new Date().toISOString();
}

const ChatStore = Assign({}, EventEmitter.prototype, {
  getCurrentMessages() {
    return {
        'Messages': ChatSession.Messages,
        'Total': ChatSession.Messages.length
    };
  },

  getCurrentTypings() {
    return {
        'Current': ChatSession.Typings,
        'Total': ChatSession.Typings.length 
    };
  },

  getCurrentSessionStatus() {
    return {
      'Open': ChatSession.Open,
      'MaxMemberSize': ChatSession.MaxMemberSize,
      'MemberSize': ChatSession.Members.length,
      'Spaces': ChatSession.MaxMemberSize === -1 ? -1 : ChatSession.MaxMemberSize - ChatSession.Members.length,
      'Start': ChatSession.StartDateTime,
      'End': ChatSession.EndDateTime
    };
  },

  emitChange() {
    this.emit(Constants.Data.Events.Change);
  },

  addChangeListener(callback) {
    this.on(Constants.Data.Events.Change, callback);
  },

  removeChangeListener(callback) {
    this.removeListener(Constants.Data.Events.Change, callback);
  }
});

AppDispatcher.register(function(action) {
    switch (action.actionType) {
      case ChatConstants.MESSAGE:
        addMessage(action.results);
        break;
      case ChatConstants.TYPING_START:
        addMemberTyping(action.results);
        break;
      case ChatConstants.TYPING_END:
        removeMemberTyping(action.results);
        break;
      case ChatConstants.START_SESSION:
        openChatSession(action.results);
        break;
      case ChatConstants.END_SESSION:
        closeChatSession();
        break;
      default:
            //no op
    }

    ChatStore.emitChange();
});

export default ChatStore;
