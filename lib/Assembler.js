const Architecture = require('./Architecture')
const Component = require('./Component')

function values(object) {
  return Object.keys(object).map(key => object[key])
}

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
    const componentKeys = Object.keys(this.architecture.components).concat(Object.keys(assemblyArchitecture.components))
    componentKeys.forEach(componentName => {
      components[componentName] = assemblyArchitecture.resolve(componentName) || this.architecture.resolve(componentName)
    })

    const actors = assemblyArchitecture.actors
    const name = assemblyName
    return new Assembly({name, components, actors})
  }

  map(cb) {
    return Object.keys(this.assemblies).map(assemblyName => {
      return cb(() => this.build(assemblyName), assemblyName)
    })
  }
}

class Assembly {
  constructor({name, components, actors}) {
    this.name = name
    this.components = components
    this.actors = actors
  }

  start() {
    values(this.components).forEach(component => {
      if (typeof component.start === 'function') {
        component.start()
      }
    })
  }

  stop() {
    values(this.components).forEach(component => {
      if (typeof component.stop === 'function') {
        component.stop()
      }
    })
  }

  createActor(type, options = {}) {
    const Actor = this.actors[type]
    return new Actor(Object.assign({components: this.components}, options))
  }
}
