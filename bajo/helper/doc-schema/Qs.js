async function buildParams (ctx, paramName, ...args) {
  const { print, importPkg } = this.bajo.helper
  const { each, isEmpty } = await importPkg('lodash-es')
  const { docSchemaLib } = this.bajoWebRestapi.helper
  const item = {
    type: 'object',
    properties: {}
  }
  each(args, a => {
    let [name, type, description] = a.split(':')
    if (isEmpty(type)) type = 'string'
    item.properties[name] = { type, description: print.__(description) }
  })
  if (!isEmpty(args)) await docSchemaLib(ctx, paramName, item)
}

export default buildParams
