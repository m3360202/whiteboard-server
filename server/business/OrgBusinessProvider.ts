import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import OrgDataProvider from '../data/OrgDataProvider';
import RoomsDataProvider from '../data/RoomsDataProvider';
import SubscriptionsDataProvider from '../data/SubscriptionsDataProvider';
import InvitesDataProvider from '../data/InvitesDataProvider';
import EmailBusinessProvider from './EmailBusinessProvider';
import { settings } from '../../app/settings';
import { getURL } from '../../app/utils/lib/getURL';

export default class OrgBusinessProvider {
  public possibleDays: any;
  public possibleUses: any;
  public _id: any;
  public days: any;
  public maxUses: any;
  static provider = null;

  static getProviderInstance() {
    if (OrgBusinessProvider.provider == null) {
      OrgBusinessProvider.provider = new OrgBusinessProvider();
    }
    return OrgBusinessProvider.provider;
  }

  constructor() {
    this.possibleDays = [0, 1, 7, 15, 30];
    this.possibleUses = [0, 1, 5, 10, 25, 50, 100];
  }

  getOrgList(userId) {
    return OrgDataProvider.getProviderInstance().getOrgList(userId);
  }

  getOrgMemberList(orgId) {
    return OrgDataProvider.getProviderInstance().getOrgMemberList(orgId);
  }
  getCommentOrgMemberList(orgId) {
    return OrgDataProvider.getProviderInstance().getCommentOrgMemberList(orgId);
  }
  getOrgMember(orgId, user_id) {
    check(orgId, String);
    check(user_id, String);
    return OrgDataProvider.getProviderInstance().getOrgMember(orgId, user_id);
  }
  insertNewOrg(orgId, orgName, userId, username, role) {
    OrgDataProvider.getProviderInstance().addNewOrg(
      orgId,
      orgName,
      userId,
      username,
    );
    OrgDataProvider.getProviderInstance().addNewOrgMember({
      orgId,
      name: orgName,
      userId,
      username,
      role,
    });
    return true;
  }

  renameOrganization(orgId, orgName, userId) {
    OrgDataProvider.getProviderInstance().updateOrganization(orgId, orgName);
    OrgDataProvider.getProviderInstance().updateOrgList(userId, orgName, orgId);
    RoomsDataProvider.getProviderInstance().updateRooms(orgId, orgName);
    return SubscriptionsDataProvider.getProviderInstance().updateSubscriptions(
      orgId,
      orgName,
    );
  }

  setOrganizationLinkedin(orgId, linkedinAppKey,linkedinAppSecret,linkedinCallBack) {
    OrgDataProvider.getProviderInstance().setOrgLinkedinAppKey({orgId,linkedinAppKey});
    OrgDataProvider.getProviderInstance().setOrgLinkedinAppSecret({orgId,linkedinAppSecret});
    OrgDataProvider.getProviderInstance().setOrgLinkedinCallBack({orgId,linkedinCallBack});
    return true;
  }
  setOrganizationGhost(data) {

    console.log('ghostKey2',data);

    if(data.ghostKey){
      OrgDataProvider.getProviderInstance().setOrgGhostKey({orgId:data.orgId,ghostKey:data.ghostKey});
    }
    if(data.ghostUrl){
      OrgDataProvider.getProviderInstance().setOrgGhostUrl({orgId:data.orgId,ghostUrl:data.ghostUrl});
    }
    if(data.author){ 
      OrgDataProvider.getProviderInstance().setOrgGhostAuthor({orgId:data.orgId,author:data.author});
    }
    if(data.tags && data.tags.length>0){
      OrgDataProvider.getProviderInstance().setOrgGhostTags({orgId:data.orgId,tags:data.tags});
    }
    return true;
  }

  addOrgAdmin(orgId, userId, role) {
    return OrgDataProvider.getProviderInstance().updateOrgAdmin(
      orgId,
      userId,
      role,
    );
  }

  removeOrgAdmin(orgId, userId, role) {
    return OrgDataProvider.getProviderInstance().updateOrgAdmin(
      orgId,
      userId,
      role,
    );
  }

  removeUserFromOrg(orgId, userId) {
    return OrgDataProvider.getProviderInstance().deleteUserFromOrg(
      orgId,
      userId,
    );
  }

  addOneUserToOrg(orgId, orgName, user, link, role, language) {
    console.log('addOneUserToOrg', orgId, orgName, user, link, role, language);
    const currentUser = Meteor.users.findOne({ username: user.username });
    console.log('currentUser', currentUser    )
    if (!currentUser) return false;

    const userId = currentUser._id;
    const orgMember = OrgDataProvider.getProviderInstance().getOrgMember(
      orgId,
      userId,
    );
      console.log('orgMember', orgMember);
    if (orgMember.length === 0) {
      const username = user.username;
      OrgDataProvider.getProviderInstance().addNewOrgMember(
        {
          orgId,
          name: orgName,
          userId,
          username,
          role
        }
      );
      EmailBusinessProvider.getProviderInstance().sendOrgInvitationToExistingUser(
        orgId,
        orgName,
        currentUser.name,
        currentUser.emails[0].address,
        link,
        language
      );
      return true;
    }
    return false;
  }

  getInviteUrl(invite) {
    const { _id } = invite;

    const useDirectLink =
      settings.get('Accounts_Registration_InviteUrlType') === 'direct';

    return getURL(`invite/${_id}`, {
      full: useDirectLink,
      cloud: !useDirectLink,
      cloud_route: 'invite',
    });
  }

  findUserOrCreateInvite(userId, invite) {
    if (!userId || !invite) {
      return false;
    }

    const { days = 1, maxUses = 0 } = invite;

    if (!this.possibleDays.includes(days)) {
      throw new Meteor.Error(
        'invalid-number-of-days',
        'Invite should expire in 1, 7, 15 or 30 days, or send 0 to never expire.',
      );
    }

    if (!this.possibleUses.includes(maxUses)) {
      throw new Meteor.Error(
        'invalid-number-of-uses',
        'Invite should be valid for 1, 5, 10, 25, 50, 100 or infinite (0) uses.',
      );
    }

    // Before anything, let's check if there's an existing invite with the same settings for the same channel and user and that has not yet expired.
    const existing =
      InvitesDataProvider.getProviderInstance().getByUserRoomMaxUsesAndExpiration(
        userId,
        invite.rid,
        invite.orgId,
        maxUses,
        days,
      );
    // If an existing invite was found, return it's _id instead of creating a new one.
    if (existing) {
      existing.url = this.getInviteUrl(existing);
      return existing;
    }

    const _id = Random.id(6);

    // insert invite
    const createdAt = new Date();
    let expires = null;
    if (days > 0) {
      expires = new Date(createdAt);
      expires.setDate(expires.getDate() + days);
    }

    const createInvite = {
      _id,
      days,
      maxUses,
      rid: invite.rid,
      orgId: invite.orgId,
      type: invite.inviteType,
      userId,
      createdAt,
      expires,
      uses: 0,
    };

    InvitesDataProvider.getProviderInstance().addInvitesCreate(createInvite);
    createInvite.url = this.getInviteUrl(createInvite);
    return createInvite;
  }

  async findOrCreateInvite(userId, invite) {
    return await this.findUserOrCreateInvite(userId, invite);
  }

  listUsersInvites(userId) {
    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'listInvites',
      });
    }

    return InvitesDataProvider.getProviderInstance().getInvitesList({});
  }

  async listInvites(userId) {
    return await listUsersInvites(userId);
  }

  async removeInvite(userId, invite) {
    return await removeUsersInvite(userId, invite);
  }

  removeUsersInvite(userId, invite) {
    if (!userId || !invite) {
      return false;
    }

    if (!invite._id) {
      throw new Meteor.Error(
        'error-the-field-is-required',
        'The field _id is required',
        { method: 'removeInvite', field: '_id' },
      );
    }

    // Before anything, let's check if there's an existing invite
    const existing = InvitesDataProvider.getProviderInstance().getByID(
      invite._id,
    );

    if (!existing) {
      throw new Meteor.Error(
        'invalid-invitation-id',
        'Invalid Invitation _id',
        { method: 'removeInvite' },
      );
    }

    InvitesDataProvider.getProviderInstance().deleteUsersInvites(invite._id);
    return true;
  }

}
