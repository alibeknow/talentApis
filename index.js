'use strict'

const config = require('./config/common')
const dbLogger = require('./modules/dbLogger')
const fs = require('fs'),
  http = require('http'),
  express = require('express'),
  bodyParser = require('body-parser'),
  oasTools = require('oas-tools'),
  jsyaml = require('js-yaml'),
  path = require('path'),
  compression = require('compression'),
  securityHandlers = require('./modules/securityHandlers'),
  logger = require('./modules/logger'),
  morgan = require('morgan'),
  serverPort = config.SERVER_PORT,
  { feed_processing } = require('./db/models/index'),
  feedProcessingScheduler = require('./scheduler/feedProcessingScheduler'),
  diceScheduler = require('./scheduler/diceScheduler'),
  lensaSheduler = require('./scheduler/lensaSheduler'),
  refreshLimutShedulre = require('./scheduler/limitRefresher')
feedProcessingScheduler()
diceScheduler()
const app = express()

app.use(compression())

app.use(
  bodyParser.json({
    strict: false,
  }),
)

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
)

app.use(
  morgan('combined', {
    skip: function (req, res) {
      return res.statusCode < 400
    },
    stream: process.stderr,
  }),
)
app.use((req, res, next) => {
  logger.info(`${JSON.stringify(req.body)}, ${JSON.stringify(req.params)},${JSON.stringify(req.query)},${req.url}`)
  next()
})

var spec = fs.readFileSync(path.join(__dirname, '/api/oas-doc.yaml'), 'utf8')
var oasDoc = jsyaml.safeLoad(spec)

const options_object = {
  controllers: path.join(__dirname, './controllers'),
  checkControllers: true,
  customLogger: logger,
  loglevel: config.OAS_LOG_LEVEL,
  strict: false,
  router: true,
  validator: true,
  ignoreUnknownFormats: true,
  oasSecurity: true,
  securityFile: {
    BearerAuth: securityHandlers.verifyToken,
    apiKey: securityHandlers.verifyAPIKey,
  },
}

oasTools.configure(options_object)

oasTools.initialize(oasDoc, app, function () {
  http.createServer(app).listen(serverPort, function () {
    console.log('App running at http://localhost:' + serverPort)
    console.log('________________________________________________________________')
    if (options_object.docs !== false) {
      console.log('API docs (Swagger UI) available on http://localhost:' + serverPort + '/docs')
      console.log('________________________________________________________________')
    }
  })
})

app.get('/info', function (req, res) {
  res.send({
    info: 'GLO Talent API v1.0',
    name: oasDoc.info.title,
  })
})

app.get('/', function (req, res) {
  res.status(200).send({})
})
process.on('uncaughtException', (err) => {
  logger.log('error', err)
  dbLogger(err, 'globalError', null)
  console.error('There was an uncaught error', err)
})
