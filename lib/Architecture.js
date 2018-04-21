const Component = require('./Component')

module.exports = class Architecture {
  constructor({components} = {components: {}}) {
    this.components = components
  }

  register(componentName, implementation) {
    const component = this.components[componentName] = new Component(componentName, implementation)
    return component
  }

  get(componentName) {
    return new this.components[componentName].implementation()
  }

  clone() {
    const components = Object.assign({}, this.components)
    return new Architecture({components})
  }
}
