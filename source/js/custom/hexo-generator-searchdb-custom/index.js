// Refer to hexo-generator-searchdb
// https://github.com/next-theme/hexo-generator-searchdb/blob/main/dist/search.js

/* global hexo */

'use strict';

const { extname } = require('path');

hexo.config.search = Object.assign({
  path   : 'search.xml',
  field  : 'post',
  content: true,
  format : 'html'
}, hexo.config.search);
const config = hexo.config.search;

// Add extension name if doesn't exist
if (!extname(config.path)) {
  config.path += '.xml';
}
if (extname(config.path) === '.xml') {
  console.log('test xml')
  hexo.extend.generator.register('xml', require('./lib/xml_generator'));
}
if (extname(config.path) === '.json') {
  console.log('test json')
  hexo.extend.generator.register('json', require('./lib/json_generator'));
}


