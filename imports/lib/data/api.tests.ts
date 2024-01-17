import assert from 'assert';
// import '../imports/api/tasks.tests';

describe('boardx.api', () => {
  if (Meteor.isClient) {
    it('client is not server', () => {
      assert.strictEqual(Meteor.isServer, false);
    });
  }

  if (Meteor.isServer) {
    it('server is not client', () => {
      assert.strictEqual(Meteor.isClient, false);
    });
  }

  if (true) {
    it('this is my first test', () => {
      assert.strictEqual(1, 1);
    });
  }

  if (true) {
    it('this is my 2nd test', () => {
      assert.strictEqual(1, 1);
    });
  }
});
