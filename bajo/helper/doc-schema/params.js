async function buildParams (ctx, paramName, ...args) {
  const { print, importPkg, getConfig } = this.bajo.helper
  const { each, isEmpty, keys, last, isBoolean } = await importPkg('lodash-es')
  const { docSchemaLib } = this.bajoWebRestapi.helper
  const cfgWeb = getConfig('bajoWeb')
  let transform = false
  if (isBoolean(last(args))) {
    transform = args.pop()
  }
  const item = {
    type: 'object',
    properties: {}
  }
  each(args, a => {
    let [name, type, description, def] = a.split('|')
    if (isEmpty(type)) type = 'string'
    item.properties[name] = { type, description: print.__(description), default: def }
  })
  if (transform) {
    each(keys(cfgWeb.qsKey), k => {
      const v = cfgWeb.qsKey[k]
      if (k === v || !item.properties[k]) return undefined
      item.properties[v] = item.properties[k]
      delete item.properties[k]
    })
  }
  if (!isEmpty(args)) await docSchemaLib(ctx, paramName, item)
}

export default buildParams
