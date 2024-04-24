/**
 * Generate search database in JSON format
 * Refer to hexo-generator-searchdb
 * https://github.com/next-theme/hexo-generator-searchdb/blob/main/dist/search.js
 * 
 * No Changes
 */
'use strict';

module.exports = function(locals) {
  const config = this.config;
  const database = require('./database')(locals, config);
  return {
    path: config.search.path,
    data: JSON.stringify(database)
  };
};
