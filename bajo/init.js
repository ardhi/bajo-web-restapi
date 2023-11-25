async function start () {
  const { importPkg } = this.bajo.helper
  const { uniq } = await importPkg('lodash-es')
  this.bajoWebRestapi.config.format.supported.push('json')
  this.bajoWebRestapi.config.format.supported = uniq(this.bajoWebRestapi.config.format.supported)
}

export default start
