async function docSchemaLib (ctx, name, obj) {
  const { importPkg } = this.bajo.helper
  const { merge } = await importPkg('lodash-es')
  if (ctx.getSchema(name)) return
  const value = merge({}, obj, { $id: name })
  ctx.addSchema(value)
}

export default docSchemaLib
