export const replaceVariables = (str, callback) =>
  str.replace(/\{ *([^\{\} ]+)[^\{\}]*\}/gim, callback);
