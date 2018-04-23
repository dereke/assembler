const Component = require('./Component')

module.exports = class Architecture {
  constructor({components} = {components: {}}) {
    this.components = components
  }

  register(componentName, implementation) {
    const component = this.components[componentName] = new Component(componentName, implementation)
    return component
  }

  resolve(componentName) {
    const architectureComponent = this.components[componentName]

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

  clone() {
    const components = Object.assign({}, this.components)
    return new Architecture({components})
  }
}
