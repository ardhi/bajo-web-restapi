async function bajoWebAfterInit () {
  this.app.bajoWeb.config.paramsCharMap[this.config.mapSlash] = '/'
  this.app.bajoWeb.config.paramsCharMap[this.config.mapDot] = '.'
}

export default bajoWebAfterInit
