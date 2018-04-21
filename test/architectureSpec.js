const assert = require('assert')
const Architecture = require('../lib/Architecture')
const Assembler = require('../lib/Assembler')

describe('architecture', () => {
  it('creates a system with dependencies', () => {
    const architecture = new Architecture()
    architecture.register('server', Server).depends('usersConnector')
    architecture.register('usersConnector', Users).depends('userStore')
    architecture.register('userStore', UserStore)

    const assembler = new Assembler({architecture})
    const server = assembler.resolve('server')

    assert(server instanceof Server)
    assert(server.usersConnector instanceof Users)
    assert(server.usersConnector.userStore instanceof UserStore)
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

  it('cloned architecture works in assembler', () => {
    const architecture = new Architecture()
    architecture.register('server', Server).depends('usersConnector')
    architecture.register('usersConnector', Users)

    const testArchitecture = architecture.clone()

    const assembler = new Assembler({architecture: testArchitecture})
    const server = assembler.resolve('server')

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

    const testAssembler = new Assembler({architecture: testArchitecture})
    const testServer = testAssembler.resolve('server')

    assert(testServer.usersConnector instanceof TestUsers)

    const assembler = new Assembler({architecture: architecture})
    const server = assembler.resolve('server')

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
