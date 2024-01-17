/*
msut comment some to reduce upload url time
edit Oct 11. 2021
*/
const metascraper = require('metascraper')([
  require('metascraper-author')(),
  // require('metascraper-date')(),
  // require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-logo')(),
  require('metascraper-clearbit')(),
  //require('metascraper-publisher')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
  //require('metascraper-youtube')(),
  //require('metascraper-media-provider')(),
  //require('metascraper-video')()
]);

// const got = require('got')

async function got(url) {
  const request = require('request');

  return new Promise((resolve, reject) => {
    request(url, function (error, response, body) {
      resolve(body);
    });
  });
}

export default getUrlMetaData = async function (websiteUrl) {
  let options = {};
  let result = {};

  options.url = websiteUrl;
  options.peekSize = 2048;
  options.headers = { 'accept-language': 'en' };
  options.timeout = 4000;

  try {
    let targetUrl = websiteUrl;
    const body = await got(targetUrl);
    const metadata = await metascraper({ html: body, url: targetUrl });

    if (
      (metadata.image == null || metadata.image.indexOf('.svg') != -1) &&
      metadata.logo != null
    )
      metadata.image = metadata.logo;

    if (metadata.image == null) metadata.image = '/fileIcons/weblink.png';

    if (metadata.image && metadata.image.indexOf('.gif') > -1 && metadata.logo)
      metadata.image = metadata.logo;

    return metadata;
  } catch (err) {
    result.image = '/fileIcons/weblink.png';
    result.title = websiteUrl;
    result.description = '';
    return result;
  }
};

const getTitle = function (self) {
  if (!self) {
    return;
  }
  return (
    self.ogTitle ||
    self.twitterTitle ||
    self.title ||
    self.pageTitle ||
    self.ogSiteName
  );
};

const getDescription = function (self) {
  if (!self) {
    return;
  }
  const description =
    self.ogDescription || self.twitterDescription || self.description;
  if (description == null) {
    return;
  }
  return _.unescape(description.replace(/(^[“\s]*)|([”\s]*$)/g, ''));
};

const getImage = function (self) {
  //
  if (!self) {
    return;
  }
  let decodedOgImage;
  if (self.ogImage && self.ogImage.url) {
    decodedOgImage = self.ogImage.url; //self.ogImage.replace(/&amp;/g, "&");
  }
  if (self.ogImage && self.ogImage.length && self.ogImage.length > 0) {
    decodedOgImage = self.ogImage[0].url; //self.ogImage.replace(/&amp;/g, "&");
  }

  let twitterImage1;
  if (self.twitterImage) {
    twitterImage1 = self.twitterImage.url;
  }

  let url = decodedOgImage || twitterImage1 || self.msapplicationTileImage;
  if (url == null) {
    return;
  }
  return url;
};
