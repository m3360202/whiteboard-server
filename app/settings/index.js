import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {
  // @ts-ignore
  module.exports = require('./server/index.ts');
}
