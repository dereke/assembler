const assert = require('assert')
const Architecture = require('../lib/Architecture')
const Assembler = require('../lib/Assembler')

describe('assembler', () => {
  it('assembly with no overrides builds the standard architecture', () => {
    const architecture = new Architecture()
    architecture.register('server', Server).depends('usersConnector')
    architecture.register('usersConnector', UsersConnector)

    architecture.register('usersServer', UsersServer).depends('users')
    architecture.register('users', Users).depends('userStore')
    architecture.register('userStore', UserStore)

    const assembler = new Assembler({architecture})
    const assembly = assembler.build()

    const components = assembly.components

    assert(components.server instanceof Server)
    assert(components.usersConnector instanceof UsersConnector)
    assert(components.usersServer instanceof UsersServer)
    assert(components.users instanceof Users)
    assert(components.userStore instanceof UserStore)
  })

  it('assembly can be started and stopped', () => {
    class StartableServer {
      start() {
        this.status = 'started'
      }

      stop() {
        this.status = 'stopped'
      }
    }
    const architecture = new Architecture()
    architecture.register('server', StartableServer)


    const assembler = new Assembler({architecture})

    const assembly = assembler.build()
    assert(assembly.components.server.status === undefined)
    assembly.start()
    assert(assembly.components.server.status === 'started')
    assembly.stop()
    assert(assembly.components.server.status === 'stopped')
  })
})

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

class UsersConnector {}

class UserStore {}

class UsersServer {
  constructor({users}) {
    this.users = users
  }
}
