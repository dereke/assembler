const Component = require('./Component')

module.exports = class Architecture {
  constructor({components} = {components: {}}) {
    this.components = components
    this.resolved = {}
  }

  register(componentName, implementation) {
    const component = this.components[componentName] = new Component(componentName, implementation)
    return component
  }

  resolve(componentName) {
    const architectureComponent = this.components[componentName]

    if (!architectureComponent) {
      return
    }
    if (this.resolved[componentName]) {
      return this.resolved[componentName]
    }

    const dependencies = {}
    Object.keys(architectureComponent.dependencies).forEach(dependency => {
      const connector = architectureComponent.dependencies[dependency]
      if (connector instanceof Component) {
        dependencies[dependency] = new connector.implementation({})
      } else {
        dependencies[dependency] = this.resolve(dependency)
      }
    })

    const component = new architectureComponent.implementation(dependencies)
    this.resolved[componentName] = component
    return component
  }

  clone() {
    const components = Object.assign({}, this.components)
    return new Architecture({components})
  }
}
