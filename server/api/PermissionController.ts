import { Meteor } from 'meteor/meteor';
import PermissionBusinessProvider from '../business/PermissionBusinessProvider';


Meteor.methods({

  getRoleItems() {
    this.unblock();
    return PermissionBusinessProvider.getProviderInstance().getRoleItems();
  },
  getPermissionItems(keyword) {
    this.unblock();
    return PermissionBusinessProvider.getProviderInstance().getPermissionItems(keyword);
  },
  addRoleItems(data) {
    this.unblock();
    return PermissionBusinessProvider.getProviderInstance().addRoleItems(data);
  },
  addPermissionItems(data) {
    this.unblock();
    return PermissionBusinessProvider.getProviderInstance().addPermissionItems(data);
  },
  updateRoleItems(data) {
    this.unblock();
    return PermissionBusinessProvider.getProviderInstance().updateRoleItems(data);
  },
  updatePermissionItems(data) {
    this.unblock();
    return PermissionBusinessProvider.getProviderInstance().updatePermissionItems(data);
  },
  updatePermissionValue(data) {
    this.unblock();
    return PermissionBusinessProvider.getProviderInstance().updatePermissionValue(data);
  },
  removeRoleItems(id) {
    this.unblock();
    return PermissionBusinessProvider.getProviderInstance().removeRoleItems(id);
  },
  removePermissionItems(id) {
    this.unblock();
    return PermissionBusinessProvider.getProviderInstance().removePermissionItems(id);
  },
  checkActionPermission(data) {
    this.unblock();
    return PermissionBusinessProvider.getProviderInstance().checkActionPermission(data);
  },
  checkActionPermissionOfTeam(data) {
    this.unblock();
    return PermissionBusinessProvider.getProviderInstance().checkActionPermissionOfTeam(data);
  },
  checkActionPermissionOfRoom(data) {
    this.unblock();
    return PermissionBusinessProvider.getProviderInstance().checkActionPermissionOfRoom(data);
  }
});
