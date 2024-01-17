import RolesModel from '../models/Roles';
import { RolesRaw } from './Roles';
import { trash } from '../models/_BaseDb';
import UsersModel from '../models/Users';
import { UsersRaw } from './Users';
import RoomsModel from '../models/Rooms';
import { RoomsRaw } from './Rooms';
import SubscriptionsModel from '../models/Subscriptions';
import { SubscriptionsRaw } from './Subscriptions';
import SettingsModel from '../models/Settings';
import { SettingsRaw } from './Settings';

const trashCollection = trash.rawCollection();

export const Users = new UsersRaw(
  UsersModel.model.rawCollection(),
  trashCollection,
);
export const Rooms = new RoomsRaw(
  RoomsModel.model.rawCollection(),
  trashCollection,
);

export const Subscriptions = new SubscriptionsRaw(
  SubscriptionsModel.model.rawCollection(),
  trashCollection,
);

export const Roles = new RolesRaw(
  RolesModel.model.rawCollection(),
  trashCollection,
  { Users, Subscriptions },
);
export const Settings = new SettingsRaw(
  SettingsModel.model.rawCollection(),
  trashCollection,
);
