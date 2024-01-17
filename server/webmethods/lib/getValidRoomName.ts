import { Meteor } from 'meteor/meteor';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { Rooms } from '../../../app/models/server/index';

export const getValidRoomName = (displayName, rid = '', options = {}) => {
  let slugifiedName = displayName;

  const cleanName = displayName;
  if (options.allowDuplicates !== true) {
    const room = Rooms.findOneByDisplayName(displayName);
    if (room && room._id !== rid) {
      if (room.archived) {
        throw new Meteor.Error(
          'error-archived-duplicate-name',
          `There's an archived channel with name ${cleanName}`,
          { function: 'RocketChat.getValidRoomName', channel_name: cleanName },
        );
      } else {
        throw new Meteor.Error(
          'error-duplicate-channel-name',
          `A channel with name '${cleanName}' exists`,
          { function: 'RocketChat.getValidRoomName', channel_name: cleanName },
        );
      }
    }
  }
  slugifiedName = cleanName;

  if (options.allowDuplicates !== true) {
    const room = Rooms.findOneByName(slugifiedName);
    if (room && room._id !== rid) {
      if (settings.get('UI_Allow_room_names_with_special_chars')) {
        let tmpName = slugifiedName;
        let next = 0;
        while (Rooms.findOneByNameAndNotId(tmpName, rid)) {
          tmpName = `${slugifiedName}-${++next}`;
        }
        slugifiedName = tmpName;
      } else if (room.archived) {
        throw new Meteor.Error(
          'error-archived-duplicate-name',
          `There's an archived channel with name ${escapeHTML(slugifiedName)}`,
          {
            function: 'RocketChat.getValidRoomName',
            channel_name: escapeHTML(slugifiedName),
          },
        );
      } else {
        throw new Meteor.Error(
          'error-duplicate-channel-name',
          `A channel with name '${escapeHTML(slugifiedName)}' exists`,
          {
            function: 'RocketChat.getValidRoomName',
            channel_name: escapeHTML(slugifiedName),
          },
        );
      }
    }
  }

  return displayName;
};
