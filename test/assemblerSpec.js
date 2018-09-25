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

  it('assembly can be started and stopped', async () => {
    class StartableServer {
      start() {
        return Promise.resolve().then(() => this.status = 'started')
      }

      stop() {
        return Promise.resolve().then(() => this.status = 'stoped')
      }
    }
    const architecture = new Architecture()
    architecture.register('server', StartableServer)


    const assembler = new Assembler({architecture})
    assembler.define('standard')

    const assembly = assembler.build('standard')
    assert.equal(assembly.components.server.status, undefined)
    await assembly.start()
    assert.equal(assembly.components.server.status, 'started')
    await assembly.stop()
    assert.equal(assembly.components.server.status, 'stoped')
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

  it('assembly can extend another assembly', () => {
    const architecture = new Architecture()

    class TestComponent0 {}
    class TestComponent1 {}
    class TestComponent2 {}
    class TestComponent3 {}

    architecture.register('testComponentRoot', TestComponent0)

    const assembler = new Assembler({architecture})
    const domMemory = assembler.define('dom-memory')
    domMemory.register('testComponent', TestComponent1)
    domMemory.register('testComponentInherit', TestComponent2)

    assembler.define('dom-http-memory')
      .basedOn('dom-memory')
      .register('testComponent', TestComponent3)

    const assembly = assembler.build('dom-http-memory')
    const components = assembly.components

    assert(components.testComponentRoot instanceof TestComponent0)
    assert(components.testComponentInherit instanceof TestComponent2)
    assert(components.testComponent instanceof TestComponent3)
  })

  it('can draw dependencies from an extended assembly', () => {
    const architecture = new Architecture()

    class TestComponentRoot {}
    class TestComponentDependency {}
    class TestComponentAssembly1 {}
    class TestComponentAssembly2 {}

    architecture.register('testComponentRoot', TestComponentRoot)
      .depends('testComponentDependency')

    architecture.register('testComponentDependency', TestComponentDependency)

    const assembler = new Assembler({architecture})
    const domMemory = assembler.define('dom-memory')
    domMemory.register('testComponentDependency', TestComponentAssembly1)

    const domHttpMemory = assembler.define('dom-http-memory')
      .basedOn('dom-memory')
    
    domHttpMemory.register('testComponentDependency', TestComponentAssembly2)

    const diagram1 = architecture.draw()
    const expectedDiagram1 = `graph TD
testComponentRoot["testComponentRoot (TestComponentRoot)"] --> testComponentDependency["testComponentDependency (TestComponentDependency)"]`
    assert.equal(diagram1, expectedDiagram1)

    const diagram2 = assembler.getAssembly('dom-memory').draw()
    const expectedDiagram2 = `graph TD
testComponentRoot["testComponentRoot (TestComponentRoot)"] --> testComponentDependency["testComponentDependency (TestComponentAssembly1)"]`
    assert.equal(diagram2, expectedDiagram2)

    const diagram3 = assembler.getAssembly('dom-http-memory').draw()
    const expectedDiagram3 = `graph TD
testComponentRoot["testComponentRoot (TestComponentRoot)"] --> testComponentDependency["testComponentDependency (TestComponentAssembly2)"]`
    assert.equal(diagram3, expectedDiagram3)
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

  it('building an assembly twice results in different instances of components', () => {
    const assembler = new Assembler()
    assembler.define('standard').register('server', Server)

    let assembly1
    let assembly2
    assembler.map(build => {
      assembly1 = build()
      assembly2 = build()
    })


    assert.notEqual(assembly1.components.server, assembly2.components.server)
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
