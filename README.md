# Nora.js
#### Sweet, simple express services

A sweet, simple, express-oriented framework for quickly hammering out ES7-style services. Convention over configuration, 
but hardly any of either, Nora is aware of a `Server`, `Configuration`s and `Service`s – with the server representing your app. 

In terms of lifecycle, Nora apps typically do the following:

* Spin up a `Server`, which can configure Express as needed
* Add `Configuration`s, potentially instantiating DB connections, wiring up Express routes, etc
* Add `Service`s, which do the business logic of your application
* Start express by listening on the designated port (5000 by default)

Configurations have a two-step lifecycle, `Configuration.preConfigure` and `Configuration.postConfigure` respectively. The
difference between the two is that the latter is called after all configs have had their `Configuration.preConfigure` methods 
run and all services have had their `Service.configure` methods run – allowing services to be retrieved by name. 


# A simple example:

`svc/DummyService.js`:

```
const nora = require('norajs')
class DummyService extends nora.Service {

  postConfigure(server){
    this.logger.info('Configured!')
  }

  doSomething(){
    return 'Dummy service did something!'
  }
}

module.exports = new DummyService()
```

`app.js`:

```
const nora = require('norajs')
class DummyRouter extends nora.Configuration {

  postConfigure(server, config, idx){
    const { app } = server         
    const { DummyService } = server.named

    const router = nora.Router()
    router.get('/dummy', async (req, res, next) => {
      res.send({name: 'Jimbo Jones', message: DummyService.doSomething() })
    })

    app.use('/test', router)
  }
}

const server = new nora.Server({
  basePath: __dirname,
  nora: { autoscan: true }
})
server.addConfig(new DummyRouter())
server.start()
```

Note that we specified `autoscan: true` on the server's `nora` property, allowing nora to scan both the `./config` and `./svc` folders for Services and Configurations respectively. 