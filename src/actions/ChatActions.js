import AppDispatcher from '../dispatcher/AppDispatcher';
import ChatConstants from '../constants/ChatConstants';

function dispatch(data, actionType) {
  AppDispatcher.dispatch({
    actionType: actionType,
    results: data
  });
}

export default class ChatActions {
    addMessage(data) {
      dispatch(data, ChatConstants.MESSAGE);
    }

    setMembers(members) {
      dispatch(members, ChatConstants.UPDATE_PARTICIPANTS);
    }

    setJoiner(member) {
      dispatch(member, ChatConstants.PARTICIPANT_JOIN);
    }

    removeMember(member) {
      dispatch(member, ChatConstants.PARTICIPANT_LEAVE);
    }

    addMemberTyping(member) {
      dispatch(member, ChatConstants.TYPING_START);
    }

    removeMemberTyping(member) {
      dispatch(member, ChatConstants.TYPING_END);
    }

    openSession(maximum) {
      dispatch(maximum, ChatConstants.START_SESSION);
    }

    closeSession() {
      dispatch(null, ChatConstants.END_SESSION);
    }
}