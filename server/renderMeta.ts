import { onPageLoad } from 'meteor/server-render';
import settings from '../variableSettings';
import { Board } from '../imports/lib/data/collectionsServer';

const siteName = 'BoardX';

function createMetaTag(property, content) {
  return `<meta property="${property}" content="${content}">`;
}

onPageLoad(async (sink) => {
  let { pathname } = sink.request.url;
  pathname = pathname.split('?')[0];

  if (pathname.includes('/board/') || pathname.includes('/rocketchat/')) {
    let boardId = '';
    let board = null;
    if (pathname.indexOf('/board/') > -1) {
      boardId = pathname.substr(7, pathname.length - 7);
      board = Board.findOne(boardId);
    }

    if (pathname.indexOf('/rocketchat/') > -1) {
      boardId = pathname.substr(
        '/rocketchat/'.length,
        pathname - '/rocketchat/'.length,
      );
      board = Board.findOne(boardId);
    }

    if (board) {
      const title = board.name;
      const description = 'a digital board that empower us to create';
      const image = board.thumbnail;
      sink.appendToHead(createMetaTag('og:title', `board: ${title}`));
      sink.appendToHead(createMetaTag('og:description', description));
      sink.appendToHead(
        createMetaTag('og:url', Meteor.settings.public.WebSite),
      ); // 'https://www.boardx.us'
      sink.appendToHead(createMetaTag('og:image', image));
      sink.appendToHead(createMetaTag('og:site_name', siteName));
    }
  }
});
