import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { RocketChatFile } from '../../../app/file';
import { FileUpload } from '../../../app/file-upload';
import { Users } from '../../../app/models';


Meteor.methods({
  'setUserAvatar'(user, dataURI, contentType, service) {
    this.unblock();
    setUserAvatar(user, dataURI, contentType, service);
  }
});

export const setUserAvatar = function (user, dataURI, contentType, service) {
  let encoding;
  let image;

  if (service === 'initials') {
    return Users.setAvatarData(user._id, service, null);
  } if (service === 'url') {
    let result = null;

    try {
      result = HTTP.get(dataURI, { npmRequestOptions: { encoding: 'binary', rejectUnauthorized: false } });
      if (!result) {

        throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${encodeURI(dataURI)}`, { function: 'setUserAvatar', url: dataURI });
      }
    } catch (error) {
      if (!error.response || error.response.statusCode !== 404) {

        throw new Meteor.Error('error-avatar-url-handling', `Error while handling avatar setting from a URL (${encodeURI(dataURI)}) for ${user.username}`, { function: 'RocketChat.setUserAvatar', url: dataURI, username: user.username });
      }
    }

    if (result.statusCode !== 200) {

      throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${dataURI}`, { function: 'setUserAvatar', url: dataURI });
    }

    if (!/image\/.+/.test(result.headers['content-type'])) {

      throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${dataURI}`, { function: 'setUserAvatar', url: dataURI });
    }

    encoding = 'binary';
    image = result.content;
    contentType = result.headers['content-type'];
  } else if (service === 'rest') {
    encoding = 'binary';
    image = dataURI;
  } else {
    const fileData = RocketChatFile.dataURIParse(dataURI);
    encoding = 'base64';
    image = fileData.image;
    contentType = fileData.contentType;
  }

  const buffer = Buffer.from(image, encoding);
  // console.log(FileUpload )
  const fileStore = FileUpload.getStore('Avatars');
  // 
  fileStore.deleteByName(user.username);

  const file = {
    userId: user._id,
    type: contentType,
    size: buffer.length,
  };

  fileStore.insert(file, buffer, (err, result) => {
    Meteor.setTimeout(function () {
      Users.setAvatarData(user._id, service, result.etag);
    }, 500);
  });
};
