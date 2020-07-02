'use strict'
let result = require('dotenv').config()

module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  SERVER_PORT: process.env.SERVER_PORT,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  DICE_CLIENT_ID: process.env.DICE_CLIENT_ID,
  DICE_CLIENT_SECRET: process.env.DICE_CLIENT_SECRET,
  DICE_USERNAME: process.env.DICE_USERNAME,
  DICE_PASSWORD: process.env.DICE_PASSWORD,
  LENSA_TOKEN: process.env.LENSA_TOKEN,
  ENABLE_RESUME_PARSER: process.env.ENABLE_RESUME_PARSER,
  RESUME_PARSER_URL: process.env.RESUME_PARSER_URL,
  DOWNLOAD_DIR_PATH: process.env.DOWNLOAD_DIR_PATH,
  ENABLE_LOG: process.env.debug,
  LOG_LEVEL: process.env.NODE_ENV,
  OAS_LOG_LEVEL: process.env.NODE_ENV,
}
