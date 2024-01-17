import { RoleItems, PermissionItems } from '../../imports/lib/data/collectionsServer';

export default class PermissionDataProvider {
  static provider = null;

  static getProviderInstance() {
    if (PermissionDataProvider.provider == null) {
      PermissionDataProvider.provider = new PermissionDataProvider();
    }
    return PermissionDataProvider.provider;
  }

  getRoleItems() {
    return RoleItems.find().fetch();
  }

  getPermissionItems(keyword) {
    if (keyword) {
      return PermissionItems.find({
        name: { $regex: keyword, $options: "i" }
      }).fetch();
    } else {
      return PermissionItems.find().fetch();
    }
  }
  addRoleItems(data) {
    return RoleItems.insert(data);
  }

  addPermissionItems(data) {
    return PermissionItems.insert(data);
  }
  updateRoleItems(data) {
    return RoleItems.update(data.id, { $set: { name:data.name } });
  }
  updatePermissionItems(data) {
    return PermissionItems.update(data.id, { $set: { name:data.name } });
  }
  updatePermissionValue(data) {
    const fieldToUpdate = data.name;
    const valueToSet = { [fieldToUpdate]: data.value };
    if(data.value){
      return PermissionItems.update(data.id, { $set: valueToSet });
    }
    else{
      return PermissionItems.update(data.id, {$unset: { [fieldToUpdate]: 1 }});
    }
    
  }
  removeRoleItems(id) {
    let data = PermissionItems.findOne(id);
    const fieldToRemove = data.name;
    const removeQuery = { [fieldToRemove]: "" };

    const items = PermissionItems.find({}).fetch();

    for (const item of items) {
      if (item.hasOwnProperty(fieldToRemove)) {
        PermissionItems.update({ _id: item._id }, { $unset: removeQuery });
      }
    }
    return RoleItems.remove(id);
  }
  removePermissionItems(id) {
    return PermissionItems.remove(id);
  }
  checkActionPermission(data) {
    if(data && data.permissionName){
      let rolesData = PermissionItems.findOne({name:data.permissionName});
      let userRoles = data.roles;
      let result = userRoles.some(property => property in rolesData);
      return  result;
  }
  else{
    return false;
  }
}
checkActionPermissionOfTeam(data) {
  
  if(data && data.permissionName && data.role){
    let roleName ;
  if(data.role == 'member'){
    roleName = 'Team Member'
  }
  if(data.role == 'owner'){
    roleName = 'Team Owner'
  }
  if(data.role == 'administrator'){
    roleName = 'Team Admin'
  }
    let rolesData = PermissionItems.findOne({name:data.permissionName});
    let userRoles = [roleName];
    let result = false;

    if (rolesData) {
      // 如果rolesData不是undefined
      result = userRoles.some((property) => property in rolesData);
    }
    return  result;
}
else{
  return false;
}
}
checkActionPermissionOfRoom(data) {
  
  if(data && data.permissionName && data.role){
    let roleName ;
  if(data.role == 'member'){
    roleName = 'Room Member'
  }
  if(data.role == 'owner'){
    roleName = 'Room Owner'
  }
  if(data.role == 'administrator'){
    roleName = 'Room Admin'
  }
    let rolesData = PermissionItems.findOne({name:data.permissionName});
    let userRoles = [roleName];
    let result = false;

    if (rolesData) {
      // 如果rolesData不是undefined
      result = userRoles.some((property) => property in rolesData);
    }
    return  result;
}
else{
  return false;
}
}
}
