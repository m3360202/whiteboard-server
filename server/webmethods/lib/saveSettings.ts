import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { settings } from '../../../app/settings';
import { Settings } from '../../../app/models/server/index';

Meteor.methods({
  saveSettings: (params = []) => {
    const uid = Meteor.userId();
    const settingsNotAllowed = [];
    if (uid === null) {
      throw new Meteor.Error(
        'error-action-not-allowed',
        'Editing settings is not allowed',
        {
          method: 'saveSetting',
        },
      );
    }

    params.forEach(({ _id, value }) => {
      // Verify the _id passed in is a string.
      check(_id, String);
      const setting = Settings.db.findOneById(_id);
      // Verify the value is what it should be
      switch (setting.type) {
        case 'roomPick':
          check(value, Match.OneOf([Object], ''));
          break;
        case 'boolean':
          check(value, Boolean);
          break;
        case 'int':
          check(value, Number);
          break;
        case 'multiSelect':
          check(value, Array);
          break;
        default:
          check(value, String);
          break;
      }
    });
    params.forEach(({ _id, value, editor }) =>
      settings.updateById(_id, value, editor),
    );
    return true;
  },
});
