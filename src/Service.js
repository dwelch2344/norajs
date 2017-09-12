const Base = require('./Base')
class Service extends Base { 

  priority(){
    return 100
  }

  register(server, config, idx){
    server.named[ this.identity() ] = this
  }

  configure(server, config, idx){
    this.logger.warn('Service not configured for', this)
  }

  identity(){
    return this.constructor.name
  }
}

module.exports = Service 