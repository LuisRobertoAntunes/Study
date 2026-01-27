const { join } = require('path');

/** @type {import("puppeteer").Configuration} */
module.exports = {
  // Mudamos de '.cache' para 'puppeteer_data'
  cacheDirectory: join(__dirname, 'puppeteer_data'),
};