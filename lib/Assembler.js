const Architecture = require('./Architecture')
const Component = require('./Component')

function values(object) {
  return Object.keys(object).map(key => object[key])
}

class AssemblyArchitecture extends Architecture {
  constructor({assemblyName, components = {}, actors = {}} = {components: {}, actors: {}}) {
    super({components})
    this.actors = actors
    this.assemblyName = assemblyName
  }

  basedOn(parentAssemblyName) {
    this.parentAssemblyName = parentAssemblyName
    return this
  }

  actor(type, implementation) {
    this.actors[type] = implementation
    return this
  }

  merge(otherArchitecture) {
    const components = Object.assign({}, otherArchitecture.components, this.components)
    const actors = Object.assign({}, this.actors)

    return new AssemblyArchitecture({components, actors})
  }
}

module.exports = class Assembler {
  constructor({architecture}) {
    this.architecture = architecture
    this.assemblies = {}
  }

  define(assemblyName) {
    return this.assemblies[assemblyName] = new AssemblyArchitecture({assemblyName})
  }

  build(assemblyName) {
    let assemblies = []
    let currentAssemblyName = assemblyName

    while (currentAssemblyName) {
      const assembly = this.assemblies[currentAssemblyName]
      assemblies.push(assembly)
      currentAssemblyName = assembly.parentAssemblyName
    }
    assemblies.push(this.architecture)
    assemblies = assemblies.reverse()


    const assemblyArchitecture = assemblies.reduce((last, current) => {
      if (last) {
        return current.merge(last)
      }
      return current
    }, null)

    const components = {}
    Object.keys(assemblyArchitecture.components).forEach(componentName => {
      components[componentName] = assemblyArchitecture.resolve(componentName)
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
