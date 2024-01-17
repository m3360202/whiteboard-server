import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Users } from '../../../app/models/server';

Meteor.methods({
  saveUserProfile_error(data) {
    this.unblock();

    check(data.newPassword, Match.Maybe(String));

    if (data.name) {
      Users.update({ _id: Meteor.userId() }, { $set: { name: data.name } });
    }

    if (data.newPassword) {
      Accounts.setPassword(
        Users.findOneById(Meteor.userId()).name,
        data.newPassword,
      );
    }

    return Users.findOneById(this.userId);
  },
});
