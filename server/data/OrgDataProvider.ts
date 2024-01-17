import { Promise } from 'meteor/promise';
import { Users } from '../../app/models/server/index';
import {
  Organization,
  OrganizationMember,
} from '../../imports/lib/data/collectionsServer';

export default class OrgDataProvider {
  static provider = null;

  static getProviderInstance() {
    if (OrgDataProvider.provider == null) {
      OrgDataProvider.provider = new OrgDataProvider();
    }
    return OrgDataProvider.provider;
  }

  getOrgList(userId) {
    // console.log('getorglist',userId);
    const list = OrganizationMember.find({ userId:userId}).fetch();
    // console.log('list',list);
    return list;

    // const stringForUserId = { $match: { userId: userId } };
    // const lookup = [
    //   {
    //     $lookup: {
    //       from: 'boardx_organization',
    //       localField: 'orgId',
    //       foreignField: '_id',
    //       as: 'orgs',
    //     },
    //   },
    //   {
    //     $replaceRoot: {
    //       newRoot: {
    //         $mergeObjects: [{ $arrayElemAt: ['$orgs', 0] }, '$$ROOT'],
    //       },
    //     },
    //   },
    //   { $project: { orgs: 0 } },
    // ];
    // const jointArray = lookup.concat(stringForUserId);
    // return Promise.await(
    //   OrganizationMember.rawCollection().aggregate(jointArray).toArray(),
    // );
  }
  setOrgGhostKey(data) {
    Organization.update({ _id: data.orgId }, { $set: {ghostKey: data.ghostKey } });
    return true;
  }
  setOrgGhostUrl(data) {
    Organization.update({ _id: data.orgId }, { $set: { ghostUrl: data.ghostUrl} });
    return true;
  }
  setOrgGhostAuthor(data) {
    Organization.update({ _id: data.orgId }, { $set: { ghostAuthor: data.author} });
    return true;
  }
  setOrgGhostTags(data) {
    Organization.update({ _id: data.orgId }, { $set: { ghostTags: data.tags} });
    return true;
  }
  setOrgLinkedinAppKey(data) {
    Organization.update({ _id: data.orgId }, { $set: { linkedinAppKey: data.linkedinAppKey} });
    return true;
  }
  setOrgLinkedinAppSecret(data) {
    Organization.update({ _id: data.orgId }, { $set: { linkedinAppSecret: data.linkedinAppSecret} });
    return true;
  }
  setOrgLinkedinCallBack(data) {
    Organization.update({ _id: data.orgId }, { $set: { linkedinCallBack: data.linkedinCallBack} });
    return true;
  }
  updateOrgList(userId, orgName, orgId) {
    OrganizationMember.update({ userId, orgId }, { $set: { name: orgName } });
  }

  joinedStringForOrgMemberUser = [
    {
      $addFields: {
        orgName: '$name',
      },
    },
    { $unset: ['username', 'name'] },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'users',
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ['$users', 0] }, '$$ROOT'],
        },
      },
    },
    {
      $project: {
        users: 0,
      },
    },
    {
      $unset: [
        'createdAt',
        'services',
        'emails',
        'profile',
        '_updatedAt',
        'roles',
        'active',
        'status',
        'statusConnection',
        'statusText',
        'username',
        'utcOffset',
        'lastLogin',
        'settings',
        'language',
        '__rooms',
        'inviteToken',
        'statusDefault',
        'avatarETag',
        'avatarOrigin',
        'requirePasswordChange',
        'type',
        'avatar',
      ],
    },
    {
      $addFields: {
        username: '$name',
      },
    },
    { $project: { name: 0 } },
    {
      $addFields: {
        name: '$orgName',
      },
    },
    { $project: { orgName: 0 } },
  ];

  getOrgMemberList(porgId) {
    const lookup = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $match: { orgId: porgId } },
      { $match: { "user.username": { $not: { $regex: "_visitor" } } } } 
    ];
    const result = Promise.await(
      OrganizationMember.rawCollection().aggregate(lookup).toArray(),
    ); 

    result.forEach(item => {
      if (typeof (item._id) !== 'string') {
        item['_id'] = item._id.toString();
      }
    })

    return result;
  }
  
  getCommentOrgMemberList(porgId) {
    const lookup = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $match: { orgId: porgId } }
    ];
    const result = Promise.await(
      OrganizationMember.rawCollection().aggregate(lookup).toArray(),
    );

    result.forEach(item => {
      if (typeof (item._id) !== 'string') {
        item['_id'] = item._id.toString();
      }
    })
    return result;
  }
  getOrgMemberInfo(userId) {
    return Users.findOne({ _id: userId });
  }
  getOrgMember(orgId, userId) {
    return OrganizationMember.find({ orgId, userId }).fetch();
  }

  getOrganizationfindOne(data) {
    return Organization.findOne(data);
  }

  addNewOrg(orgId, name, userId, username) {
    Organization.insert({ _id: orgId, name, u: { _id: userId, username } });
  }


  addNewOrgMember({ orgId, name, userId, username, role }) {
    OrganizationMember.insert({
      orgId,
      name,
      userId,
      username,
      role,
    });
  }

  updateOrganization(orgId, orgName) {
    Organization.update({ _id: orgId }, { $set: { name: orgName } });
  }

  updateOrgAdmin(orgId, userId, role) {
    return OrganizationMember.update({ orgId, userId }, { $set: { role } });
  }

  deleteUserFromOrg(orgId, userId) {
    return OrganizationMember.remove({ orgId, userId });
  }
}
