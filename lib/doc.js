import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

async function doc (ctx) {
  const { getConfig, importPkg, log } = this.bajo.helper
  const { cloneDeep } = await importPkg('lodash-es')
  const cfg = getConfig('bajoWebRestapi', { full: true })
  const opts = cloneDeep(cfg.doc.swagger)
  const optsUi = cloneDeep(cfg.doc.swaggerUi)
  if (!optsUi.transformStaticCSP) optsUi.transformStaticCSP = (header) => header
  if (!optsUi.transformSpecification) optsUi.transformSpecification = (obj, req, reply) => (obj)
  if (!opts.openapi.info.version) opts.openapi.info.version = cfg.pkg.version
  if (!opts.openapi.info.description) opts.openapi.info.description = cfg.pkg.description
  log.trace('Serving Rest Doc: %s', `/${cfg.prefix}/${cfg.doc.routePrefix}`)
  await ctx.register(swagger, opts)
  await ctx.register(swaggerUi, optsUi)
}

export default doc
