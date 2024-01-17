import { Roles } from '../../../app/models/server/index';

export const getRoles = () => Roles.find().fetch();
