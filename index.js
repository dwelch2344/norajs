const Server = require('./src/server')
const Configuration = require('./src/Configuration')
const Service = require('./src/Service')

const Router = require('express-promise-router')

module.exports = {
  Server,
  Configuration,
  Service,  
  Router,
}
