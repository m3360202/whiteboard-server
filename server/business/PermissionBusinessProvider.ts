import PermissionDataProvider from '../data/PermissionDataProvider';
export default class PermissionBusinessProvider {
  public _id: any;
  public days: any;
  public maxUses: any;
  static provider = null;

  static getProviderInstance() {
    if (PermissionBusinessProvider.provider == null) {
      PermissionBusinessProvider.provider = new PermissionBusinessProvider();
    }
    return PermissionBusinessProvider.provider;
  }
  constructor() {

  }

  getRoleItems() {
    return PermissionDataProvider.getProviderInstance().getRoleItems();
  }
  getPermissionItems(keyword) {
    return PermissionDataProvider.getProviderInstance().getPermissionItems(keyword);
  }
  addRoleItems(data) {
    return PermissionDataProvider.getProviderInstance().addRoleItems(data);
  }
  addPermissionItems(data) {
    return PermissionDataProvider.getProviderInstance().addPermissionItems(data);
  }
  updateRoleItems(data) {
    return PermissionDataProvider.getProviderInstance().updateRoleItems(data);
  }
  updatePermissionItems(data) {
    return PermissionDataProvider.getProviderInstance().updatePermissionItems(data);
  }
  updatePermissionValue(data) {
    return PermissionDataProvider.getProviderInstance().updatePermissionValue(data);
  }
  removeRoleItems(id) {
    return PermissionDataProvider.getProviderInstance().removeRoleItems(id);
  }
  removePermissionItems(id) {
    return PermissionDataProvider.getProviderInstance().removePermissionItems(id);
  }
  checkActionPermission(data) {
    return PermissionDataProvider.getProviderInstance().checkActionPermission(data);
  }
  checkActionPermissionOfTeam(data) {
    return PermissionDataProvider.getProviderInstance().checkActionPermissionOfTeam(data);
  }
  checkActionPermissionOfRoom(data) {
    return PermissionDataProvider.getProviderInstance().checkActionPermissionOfRoom(data);
  }
}
