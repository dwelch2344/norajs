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
    this.preConfigureExpress(this.app)
    return this.app
  }

  preConfigureExpress(app){
    // hook for extension
  }

  postConfigureExpress(app){
    // hook for extension
  }

  start(){    
    return this.config.executor(this)
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

async function defaultExecutor(server){

  // everything centers around express, so wire him up first
  const app = server.express()

  if( server.config.nora.autoscan === true ){
    server.addConfig(new ScanningConfig())
    server.logger.trace('Configured autoscanning')
  }

  const { config, sorter, logger } = server    

  let configs = server.configs
  let visited = []
  
  // initialize configs first, in case they instantiate services or other configs
  configs.sort(sorter)
  do { 
    for(let idx in configs){
      let cfg = configs[idx]
      if( visited.indexOf(cfg) < 0 ){
        cfg.logger = logger
        await cfg.preConfigure(server, config, idx)
        visited.push(cfg)
      }else{
        this.logger.trace('Already configured', cfg.constructor.name)
      }
    }
  }while(configs.length > visited.length)


  // register everything, making it discoverable  
  const { services } = server   
  services.sort(sorter)
  for(let idx in services){
    let service = services[idx]
    const name = service.identity()
    if( name ){
      if( server.named[name] !== undefined ){
        console.warn('[Server] Multiple registrations for service', name, '– replacing', server.named[name], 'with', service)
      }
      server.named[name] = service
    }
  }

  // post configure configs 
  for(let idx in configs){
    let cfg = configs[idx]
    await cfg.postConfigure(server, config, idx)
  }

  // now configure services
  for(let idx in services){
    let svc = services[idx]
    svc.logger = logger
    await svc.configure(server, config, idx)
  }
  
  // let's listen
  server.postConfigureExpress(app)
  app.listen(config.port)
  this.logger.trace('Listening on port', config.port)
}

module.exports = Server