const Component = require('./Component')

module.exports = class Assembler {
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
      } else {
        dependencies[dependency] = this.resolve(dependency)
      }
    })

    return new architectureComponent.implementation(dependencies)
  }
}
