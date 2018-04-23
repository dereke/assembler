const Architecture = require('./Architecture')
const Component = require('./Component')

class AssemblyArchitecture extends Architecture {
  constructor() {
    super()
    this.actors = {}
  }

  actor(type, implementation) {
    this.actors[type] = implementation
    return this
  }
}

module.exports = class Assembler {
  constructor({architecture}) {
    this.architecture = architecture
    this.assemblies = {}
  }

  define(assemblyName) {
    return this.assemblies[assemblyName] = new AssemblyArchitecture()
  }

  build(assemblyName) {
    const assemblyArchitecture = this.assemblies[assemblyName]
    const components = {}
    Object.keys(this.architecture.components).forEach(componentName => {
      components[componentName] = assemblyArchitecture.resolve(componentName) || this.architecture.resolve(componentName)
    })

    const actors = assemblyArchitecture.actors
    return new Assembly({components, actors})
  }
}

class Assembly {
  constructor({components, actors}) {
    this.components = components
    this.actors = actors
  }

  start() {
    Object.values(this.components).forEach(component => {
      if (typeof component.start === 'function') {
        component.start()
      }
    })
  }

  stop() {
    Object.values(this.components).forEach(component => {
      if (typeof component.stop === 'function') {
        component.stop()
      }
    })
  }

  createActor(type, options = {}) {
    const Actor = this.actors[type]
    return new Actor({components: this.components, ...options})
  }
}
