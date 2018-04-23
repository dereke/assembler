const Architecture = require('./Architecture')
const Component = require('./Component')

module.exports = class Assembler {
  constructor({architecture}) {
    this.architecture = architecture
    this.assemblies = {}
  }

  define(assemblyName) {
    return this.assemblies[assemblyName] = new Architecture()
  }

  build(assemblyName) {
    const assemblyArchitecture = this.assemblies[assemblyName]
    const components = {}
    Object.keys(this.architecture.components).forEach(componentName => {
      components[componentName] = assemblyArchitecture.resolve(componentName) || this.architecture.resolve(componentName)
    })

    return new Assembly({components})
  }
}

class Assembly {
  constructor({components}) {
    this.components = components
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

  createActor(type, userName) {
    const Actor = this.actors[type]
    return new Actor({userName, components: this.components})
  }
}
