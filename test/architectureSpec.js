const assert = require('assert')
const Architecture = require('../lib/Architecture')

describe('architecture', () => {
  it('creates a system with dependencies', () => {
    const architecture = new Architecture()
    architecture.register('server', Server).depends('usersConnector')
    architecture.register('usersConnector', Users).depends('userStore')
    architecture.register('userStore', UserStore)

    const server = architecture.resolve('server')

    assert(server instanceof Server)
    assert(server.usersConnector instanceof Users)
    assert(server.usersConnector.userStore instanceof UserStore)
  })

  it('only creates dependencies once', () => {
    const architecture = new Architecture()
    architecture.register('server', Server).depends('usersConnector')
    architecture.register('otherServer', Server).depends('usersConnector')
    architecture.register('usersConnector', Users)

    const server = architecture.resolve('server')
    const otherServer = architecture.resolve('otherServer')

    assert.ok(server.usersConnector)
    assert(server.usersConnector == otherServer.usersConnector)
  })

  it('creates a system with dependencies and connectors', () => {
    const architecture = new Architecture()
    architecture.register('server', Server).depends('usersConnector')
    architecture.register('usersConnector', UsersConnector)

    architecture.register('usersServer', UsersServer).depends('users')
    architecture.register('users', Users).depends('userStore')
    architecture.register('userStore', UserStore)

    const server = architecture.resolve('server')
    const usersServer = architecture.resolve('usersServer')

    assert(server instanceof Server)
    assert(server.usersConnector instanceof UsersConnector)

    assert(usersServer.users instanceof Users)
    assert(usersServer.users.userStore instanceof UserStore)
  })

  it('cloned architecture works in assembler', () => {
    const architecture = new Architecture()
    architecture.register('server', Server).depends('usersConnector')
    architecture.register('usersConnector', Users)

    const testArchitecture = architecture.clone()

    const server = testArchitecture.resolve('server')

    assert(server instanceof Server)
    assert(server.usersConnector instanceof Users)
  })

  it('substitute component using a cloned architecture', () => {
    class TestUsers {}
    const architecture = new Architecture()
    architecture.register('server', Server).depends('usersConnector')
    architecture.register('usersConnector', Users)

    const testArchitecture = architecture.clone()
    testArchitecture.register('usersConnector', TestUsers)

    const testServer = testArchitecture.resolve('server')
    assert(testServer.usersConnector instanceof TestUsers)

    const server = architecture.resolve('server')
    assert(server.usersConnector instanceof Users)
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
