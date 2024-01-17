import { Roles } from '../../../app/models/server/index';

export const getUsersInRole = (roleName, scope, options) =>
  Roles.findUsersInRole(roleName, scope, options);
