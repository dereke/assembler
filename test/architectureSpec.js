const assert = require('assert')

class Component {
  constructor(name, implementation) {
    this.dependencies = {}
    this.name = name
    this.implementation = implementation
  }

  depends(dependency) {
    this.dependencies[dependency] = true
    return this
  }
}

class Architecture {
  constructor() {
    this.components = {}
  }
  register(componentName, implementation) {
    const component = this.components[componentName] = new Component(componentName, implementation)
    return component
  }

  get(componentName) {
    return new this.components[componentName].implementation()
  }
}

describe('architecture', () => {
  it('creates a system with dependencies', () => {
    class Server {
      constructor({users}) {
        this.users = users
      }
    }

    const architecture = new Architecture()
    architecture.register('server', Server).depends('users')
    architecture.register('users', Users).depends('userStore')
    architecture.register('userStore', UserStore)

    const assembler = new Assembler({architecture})
    const server = assembler.resolve('server')

    assert(server instanceof Server)
    assert(server.users instanceof Users)
    assert(server.users.userStore instanceof UserStore)
  })

  it('creates a system with dependencies and connectors', () => {
    const architecture = new Architecture()
    architecture.register('server', Server).depends('usersConnector')
    architecture.register('usersConnector', UsersConnector)

    architecture.register('usersServer', UsersServer).depends('users')
    architecture.register('users', Users).depends('userStore')
    architecture.register('userStore', UserStore)

    const assembler = new Assembler({architecture})
    const server = assembler.resolve('server')
    const usersServer = assembler.resolve('usersServer')

    assert(server instanceof Server)
    assert(server.usersConnector instanceof UsersConnector)

    assert(usersServer.users instanceof Users)
    assert(usersServer.users.userStore instanceof UserStore)
  })
})

class Assembler {
  constructor({architecture}) {
    this.architecture = architecture
    this.instances = {}
  }

  resolve(componentName) {
    const architectureComponent = this.architecture.components[componentName]

    const dependencies = {}
    Object.keys(architectureComponent.dependencies).forEach(dependency => {
      const connector = architectureComponent.dependencies[dependency]
      if (connector instanceof Component) {
        dependencies[dependency] = new connector.implementation({})
      //} else if (typeof connector === 'function') {
        //dependencies[dependency] = new connector()
      } else {
        dependencies[dependency] = this.resolve(dependency)
      }
    })

    return new architectureComponent.implementation(dependencies)
  }
}
class Server {
  constructor({usersConnector}) {
    this.usersConnector = usersConnector
  }
}

class Users {
  constructor({userStore}) {
    this.userStore = userStore
  }
}

class UsersConnector {
}

class UserStore {}
class UsersServer {
  constructor({users}) {
    this.users = users
  }
}
