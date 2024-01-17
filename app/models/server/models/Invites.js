import { Base } from './_Base';

class Invites extends Base {
  constructor() {
    super('invites');
  }

  findOneByUserRoomMaxUsesAndExpiration(
    userId,
    rid,
    orgId,
    maxUses,
    daysToExpire,
  ) {
    let query = '';
    if (rid) {
      query = {
        rid,
        userId,
        days: daysToExpire,
        maxUses,
      };
    } else {
      query = {
        orgId,
        userId,
        days: daysToExpire,
        maxUses,
      };
    }

    if (daysToExpire > 0) {
      query.expires = {
        $gt: new Date(),
      };
    }

    if (maxUses > 0) {
      query.uses = {
        $lt: maxUses,
      };
    }

    return this.findOne(query);
  }

  // INSERT
  create(data) {
    return this.insert(data);
  }

  // REMOVE
  removeById(_id) {
    return this.remove({ _id });
  }

  // UPDATE
  increaseUsageById(_id, uses = 1) {
    return this.update(
      { _id },
      {
        $inc: {
          uses,
        },
      },
    );
  }
}

export default new Invites();
