/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import { Board, Widget } from '../../imports/lib/data/collectionsServer';

Board.allow({
  insert(userId, party) {
    return true;
  },
  update(userId, party, fields, modifier) {
    return true;
  },
  remove(userId, party) {
    return false;
  },
});

Widget.allow({
  insert(userId, party) {
    return true;
  },
  update(userId, party, fields, modifier) {
    return true;
  },
  remove(userId, party) {
    return false;
  },
});
