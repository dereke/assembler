module.exports = class Component {
  constructor(name, implementation) {
    this.dependencies = {}
    this.name = name
    this.implementation = implementation
  }

  depends(dependency) {
    this.dependencies[dependency] = true
    return this
  }
}
