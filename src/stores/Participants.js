import AppDispatcher from '../dispatcher/AppDispatcher';
import { EventEmitter } from 'events';
import ChatConstants from '../constants/ChatConstants';
import Constants from '../constants/Constants';
import Assign from 'object-assign';

let Participants = [];
let LastJoiner = null;

function setMembers(members) {
  Participants = members;
}

function addJoiner(member) {
  LastJoiner = member;
}

function removeMember(member) {
  Participants = Participants.filter(item => item.id !== member.id);
}

const ParticipantsStore = Assign({}, EventEmitter.prototype, {
  getLatestJoiner() {
    return {
      'LastJoiner': LastJoiner
    };
  },

  getCurrentMembers() {
    return {
      'Members': Participants,
      'Total': Participants.length
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
      case ChatConstants.UPDATE_PARTICIPANTS:
        setMembers(action.results);
        break;
      case ChatConstants.PARTICIPANT_JOIN:
        addJoiner(action.results);
        break;
      case ChatConstants.PARTICIPANT_LEAVE:
        removeMember(action.results);
        break;
      default:
        //no op
    }

    ParticipantsStore.emitChange();
});

export default ParticipantsStore;
