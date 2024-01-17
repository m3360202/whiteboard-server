import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { Accounts } from 'meteor/accounts-base';

import { settings } from '../../../app/settings';
import { Users, Invites } from '../../../app/models/server';
import { RateLimiterClass } from './RateLimiter';
import { addUserToRoom } from './addUserToRoom';
import { getAvatarSuggestionForUser } from './index';

export const _setUsername = function (userId, u, fullUser) {
  const username = s.trim(u);
  if (!userId || !username) {
    return false;
  }
  let nameValidation;

  try {
    nameValidation = new RegExp(`^${settings.get('UTF8_Names_Validation')}$`);
  } catch (error) {
    nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
  }
  if (!nameValidation.test(username)) {
    return false;
  }
  const user = fullUser || Users.findOneById(userId);
  // User already has desired username, return
  if (user.username === username) {
    return user;
  }
  const previousUsername = user.username;
  // Check username availability or if the user already owns a different casing of the name
  if (
    !previousUsername ||
    !(username.toLowerCase() === previousUsername.toLowerCase())
  ) {
    if (!checkUsernameAvailability(username)) {
      return false;
    }
  }
  // If first time setting username, send Enrollment Email
  try {
    if (
      !previousUsername &&
      user.emails &&
      user.emails.length > 0 &&
      settings.get('Accounts_Enrollment_Email')
    ) {
      Meteor.defer(() => {
        Accounts.sendEnrollmentEmail(user._id);
      });
    }
  } catch (e) {
    console.error(e);
  }
  // Set new username*
  Users.setUsername(user._id, username);
  user.username = username;
  if (!previousUsername && settings.get('Accounts_SetDefaultAvatar') === true) {
    const avatarSuggestions = getAvatarSuggestionForUser(user);
    let gravatar;
    Object.keys(avatarSuggestions).some((service) => {
      const avatarData = avatarSuggestions[service];
      if (service !== 'gravatar') {
        gravatar = null;
        return true;
      }
      gravatar = avatarData;
      return false;
    });
    if (gravatar != null) {
    }
  }

  // If it's the first username and the user has an invite Token, then join the invite room
  if (!previousUsername && user.inviteToken) {
    const inviteData = Invites.findOneById(user.inviteToken);
    if (inviteData && inviteData.rid) {
      addUserToRoom(inviteData.rid, user);
    }
  }

  return user;
};

export const setUsername = RateLimiterClass.limitFunction(
  _setUsername,
  1,
  60000,
  {
    0() {
      return !Meteor.userId();
    },
  },
);
