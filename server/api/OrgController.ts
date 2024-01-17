import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import OrgBusinessProvider from '../business/OrgBusinessProvider';
import { Organization } from '../../imports/lib/data/collectionsServer';

Meteor.methods({

  getOrgList() {
    const userId = this.userId;
    this.unblock();
    if (!userId) return [];
    const orgList = OrgBusinessProvider.getProviderInstance()?.getOrgList(userId);
    // console.log('orgList', orgList);
    return orgList;
  },
  getOrgInfo() {
    this.unblock();
    const userId = this.userId;
    console.log('getorglist');
    const orgList = OrgBusinessProvider.getProviderInstance()?.getOrgList(userId)
    if (!userId) return [];
 
    return orgList;
  },

  getOrgMemberList(orgId) {
    this.unblock();
    console.log('getorgmemberlist', orgId);
    if (!orgId) return [];
    check(orgId, String);
    return OrgBusinessProvider.getProviderInstance().getOrgMemberList(orgId);
  },
  getOrgExtendSettings(orgId) {
    this.unblock();
    let settings = Organization.findOne({ _id: orgId });
    if (!settings) return { ghostUrl: '', ghostKey: '', ghostAuthor: '', ghostTags: '', linkedinAppKey: '', linkedinAppSecret: '', linkedinCallBack: '' };
    else {
      return settings;
    }

  },
  getCommentOrgMemberList(orgId) {
    this.unblock();
    console.log('getcommentorgmemberlist', orgId);
    check(orgId, String);
    return OrgBusinessProvider.getProviderInstance().getCommentOrgMemberList(orgId);
  },
  getOrgMember(orgId, user_id) {
    this.unblock();
    console.log('getorgmember', orgId, user_id);
    check(orgId, String);
    return OrgBusinessProvider.getProviderInstance().getOrgMember(orgId, user_id);
  },
  insertNewOrg(orgName, orgId, user) {
    this.unblock();
    console.log('insertneworg', orgName, orgId);
    const userId = user.userId;
    const username = user.userName;
    const role = 'owner';
    check(userId, String);
    check(orgName, String);
    check(orgId, String);
    return OrgBusinessProvider.getProviderInstance().insertNewOrg(
      orgId,
      orgName,
      userId,
      username,
      role,
    );
  },

  renameOrganization(orgId, orgName, userId) {
    this.unblock();
    check(orgId, String);
    check(orgName, String);
    check(userId, String);

    return OrgBusinessProvider.getProviderInstance().renameOrganization(
      orgId,
      orgName,
      userId
    );
  },
  setOrganizationGhost(data) {
    this.unblock();
    console.log('ghostUrl', data)
    return OrgBusinessProvider.getProviderInstance().setOrganizationGhost(
      data
    );
  },
  setOrganizationLinkedin(orgId, linkedinAppKey, linkedinAppSecret, linkedinCallBack) {
    this.unblock();
    return OrgBusinessProvider.getProviderInstance().setOrganizationLinkedin(
      orgId, linkedinAppKey, linkedinAppSecret, linkedinCallBack
    );
  },
  addOrgAdmin(orgId, userId) {
    this.unblock();
    const role = 'administrator';
    check(orgId, String);
    check(userId, String);
    return OrgBusinessProvider.getProviderInstance().addOrgAdmin(
      orgId,
      userId,
      role,
    );
  },

  removeOrgAdmin(orgId, userId) {
    this.unblock();
    const role = 'member';
    check(orgId, String);
    check(userId, String);
    return OrgBusinessProvider.getProviderInstance().removeOrgAdmin(
      orgId,
      userId,
      role,
    );
  },

  removeUserFromOrg(orgId, userId) {
    this.unblock();
    check(orgId, String);
    check(userId, String);
    return OrgBusinessProvider.getProviderInstance().removeUserFromOrg(
      orgId,
      userId,
    );
  },

  addOneUserToOrg(orgId, orgName, user, link, language) {
    console.log('addOneUserToOrg', orgId, orgName, user, link, language);
    const role = 'member';
    check(orgId, String);
    return OrgBusinessProvider.getProviderInstance().addOneUserToOrg(
      orgId,
      orgName,
      user,
      link,
      role,
      language
    );
  },

  async findOrCreateInvite(userId, invite) {
    this.unblock();
    return await OrgBusinessProvider.getProviderInstance().findOrCreateInvite(
      userId,
      invite,
    );
  },

  async listInvites(userId) {
    this.unblock();
    return await OrgBusinessProvider.getProviderInstance().listInvites(userId);
  },

  async removeInvite(userId, invite) {
    this.unblock();
    return await OrgBusinessProvider.getProviderInstance().removeInvite(
      userId,
      invite,
    );
  },
});
