
const Base = require('./Base')
class Configuration extends Base { 

  priority(){
    return 100
  }
  
  preConfigure(server, config, idx){
    
  }

  postConfigure(server, config, idx){
    
  }
}

module.exports = Configuration 