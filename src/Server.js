const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const stylus = require('stylus')
const tracer = require('tracer')

const ScanningConfig = require('./configs/ScanningConfig')

const DEFAULTS = {
  port: 5000,
  executor: defaultExecutor,
  nora: {},
}


class Server { 

  constructor(config={}){
    if( !config.basePath ){
      throw new Error('[Server] config.basePath is a required parameter')
    }

    if( !config.logger ){
      config.logger = tracer.colorConsole({
        level: (process.env.TRACER_LEVEL || (config.tracer && config.tracer.level) || 'info')
      })
    }

    
    this.config = {...DEFAULTS, ...config}
    this.logger = this.config.logger
    this.configs = []
    this.services = []
    this.named = {}
  }

  express(){
    this.app = express()
    this.configureExpress(this.app)
    return this.app
  }

  configureExpress(app){
    // hook for extension
  }

  start(){
    this.config.executor(this)
  }

  addConfig(config){
    this.configs.push(config)
  }

  addService(service){
    this.services.push(service)    
  }

  sorter(a, b){
    return a.priority() - b.priority()
  } 
}

function defaultExecutor(server){

  // everything centers around express, so wire him up first
  const app = server.express()

  if( server.config.nora.autoscan === true ){
    server.addConfig(new ScanningConfig())
    server.logger.info('Configured autoscanning')
  }

  const { config, configs, sorter, logger } = server

  // register everything, making it discoverable
  
  
  // initialize configs first, in case they instantiate services
  configs.sort(sorter).forEach( (cfg, idx) => {
    cfg.logger = logger
    cfg.preConfigure(server, config, idx)
  })

  // now configure services
  const { services } = server   
  services.sort(sorter).forEach( (service, idx) => {
    const name = service.identity()
    if( name ){
      if( server.named[name] !== undefined ){
        console.warn('[Server] Multiple registrations for service', name, '– replacing', server.named[name], 'with', service)
      }
      server.named[name] = service
    }
  })
  services.sort(sorter).forEach( (svc, idx) => {
    svc.logger = logger
    svc.configure(server, config, idx)
  })

  // post configure configs 
  configs.sort(sorter).forEach( (cfg, idx) => {
    cfg.postConfigure(server, config, idx)
  })
  
  // let's listen
  app.listen(config.port)
  this.logger.info('Listening on port', config.port)
}

module.exports = Server