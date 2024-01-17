import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import ChatBusinessProvider from '../business/ChatBusinessProvider';
Meteor.methods({
  getAudioToText(audio) {
    this.unblock();
    return ChatBusinessProvider.getProviderInstance().getAudioToText(audio);
  }
});
