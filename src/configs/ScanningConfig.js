const fs = require('fs')
const Configuration = require('../Configuration')
const Service = require('../Service')
class ScanningConfig extends Configuration {

  // lower priority, so scans before most default configs
  priority(){
    return 1 
  }

  preConfigure(server, config){
    const confPath = config.confPath || config.basePath + '/config'
    this.scan('Configuration', confPath, Configuration, conf => server.addConfig(conf))

    const svcPath = config.svcPath || config.basePath + '/svc'
    this.scan('Service', svcPath, Service, svc => server.addService(svc))

    // TODO add express routes here? 
  }

  scan(type, path, instanceType, action){
    if (fs.existsSync(path)) {
      this.logger.trace(`Scanning for ${type} instances in ${path}...`)
      const instances = fs.readdirSync(path)
                         .filter( f => f.endsWith('.js'))
                         .map( f => require(path + '/' + f) )
      const matches = instances.filter( inst => inst instanceof instanceType)
      matches.forEach( action )

      if( matches.length !== instances.length ){
        this.logger.warn(`Found ${instances.length} files in ${path}, but only ${matches.length} matches`)
      }else{
        this.logger.trace(`Configured ${instances.length} ${type} instances`)
      }
    }else{
      this.logger.warn(`Could not find path for ${type} instances in ${path}`)
    }
  }
}

module.exports = ScanningConfig