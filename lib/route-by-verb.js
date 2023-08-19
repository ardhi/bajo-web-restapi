import path from 'path'
import serveRoute from './serve-route.js'

async function routeByVerb ({ file, ctx, childCtx, dir, pathPrefix, plugin, alias }) {
  const { importPkg, importModule, getConfig, print } = this.bajo.helper
  const { methodMap, docSchemaDescription } = this.bajoWebRestapi.helper
  const { isFunction, merge } = await importPkg('lodash-es')
  const cfg = getConfig('bajoWebRestapi')
  const me = this
  const url = path.dirname(file).replace(`${dir}/${pathPrefix}`, '').replaceAll('@', ':')
  const action = path.basename(file, '.js')
  const method = methodMap[action]
  let mod = await importModule(file)
  if (isFunction(mod)) mod = { handler: mod }
  mod.url = mod.url ?? url
  mod.method = method
  const defSchema = {
    description: docSchemaDescription(action),
    tags: [alias.toUpperCase()],
    response: {}
  }
  if (['create', 'update'].includes(action)) {
    defSchema.response['4xx'] = {
      description: print.__('Document error response'),
      $ref: '4xxResp#'
    }
  }
  defSchema.response['5xx'] = {
    description: print.__('General error response'),
    $ref: '5xxResp#'
  }
  if (action === 'find') defSchema.querystring = { $ref: 'qsFilter#' }
  if (isFunction(mod.schema)) mod.schema = await mod.schema.call(this, childCtx, ctx)
  mod.schema = merge({}, defSchema, mod.schema ?? {})
  const oldHandler = mod.handler
  mod.handler = async function (req, reply) {
    return await oldHandler.call(me, this, req, reply)
  }
  await serveRoute.call(me, { mod, childCtx, plugin, cfg })
}

export default routeByVerb
