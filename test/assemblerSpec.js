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
    assembler.define('standard')
    const assembly = assembler.build('standard')

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
    assembler.define('standard')

    const assembly = assembler.build('standard')
    assert(assembly.components.server.status === undefined)
    assembly.start()
    assert(assembly.components.server.status === 'started')
    assembly.stop()
    assert(assembly.components.server.status === 'stopped')
  })

  it('assembly can define alternate dependencies', () => {
    const architecture = new Architecture()
    architecture.register('server', Server).depends('usersConnector')
    architecture.register('usersConnector', UsersConnector)

    class TestUsersConnector {}

    const assembler = new Assembler({architecture})
    assembler.define('in-memory')
      .register('usersConnector', TestUsersConnector)

    const assembly = assembler.build('in-memory')
    const components = assembly.components

    assert(components.server instanceof Server)
    assert(components.usersConnector instanceof TestUsersConnector)
    assert(components.server.usersConnector instanceof TestUsersConnector)
  })

  it('assembly can define additional dependencies', () => {
    const architecture = new Architecture()

    class TestComponent {}

    const assembler = new Assembler({architecture})
    assembler.define('in-memory')
      .register('testComponent', TestComponent)

    const assembly = assembler.build('in-memory')
    const components = assembly.components

    assert(components.testComponent instanceof TestComponent)
  })

  it('creates an actor', () => {
    const architecture = new Architecture()
    architecture.register('server', Server).depends('usersConnector')
    architecture.register('usersConnector', UsersConnector)

    class Accountant {
      constructor({components, userName}) {
        this.components = components
        this.userName = userName
      }
    }

    const assembler = new Assembler({architecture})
    assembler.define('standard')
      .actor('Accountant', Accountant)

    const assembly = assembler.build('standard')
    const accountant = assembly.createActor('Accountant', {userName: 'Sherryl'})

    assert.deepEqual(accountant.components, assembly.components)
    assert.equal(accountant.userName, 'Sherryl')
  })

  it('can enumerate all the assemblies', () => {
    const architecture = new Architecture()
    const assembler = new Assembler({architecture})
    assembler.define('standard')
    assembler.define('non-standard')
    assembler.define('extremely-non-standard')

    const assemblies = assembler.map((build, name) => {
      return {
        assembly: build(),
        name
      }
    })

    const standard = assemblies[0]
    const nonStandard = assemblies[1]
    const extremelyNonStandard = assemblies[2]

    assert.equal(standard.assembly.name, 'standard')
    assert.equal(standard.name, 'standard')

    assert.equal(nonStandard.assembly.name, 'non-standard')
    assert.equal(nonStandard.name, 'non-standard')

    assert.equal(extremelyNonStandard.assembly.name, 'extremely-non-standard')
    assert.equal(extremelyNonStandard.name, 'extremely-non-standard')
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
