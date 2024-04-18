async function start () {
  const { uniq } = this.bajo.helper._
  this.bajoWebRestapi.config.format.supported.push('json')
  this.bajoWebRestapi.config.format.supported = uniq(this.bajoWebRestapi.config.format.supported)
}

export default start
