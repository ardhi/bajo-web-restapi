import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

async function doc (ctx) {
  const { routeDir } = this.app.bajoWeb
  const { cloneDeep } = this.app.bajo.lib._
  const lang = this.config.i18n.detectors.includes('path') ? '/:lang' : ''
  const opts = cloneDeep(this.config.doc.swagger)
  const optsUi = cloneDeep(this.config.doc.swaggerUi)
  if (!optsUi.transformStaticCSP) optsUi.transformStaticCSP = (header) => header
  if (!optsUi.transformSpecification) optsUi.transformSpecification = (obj, req, reply) => (obj)
  if (!opts.openapi.info.version) opts.openapi.info.version = this.config.pkg.version
  if (!opts.openapi.info.description) opts.openapi.info.description = this.config.pkg.description
  this.log.trace('Serving Rest Doc: %s', `${lang}${routeDir(this.name)}/${this.config.doc.swaggerUi.routePrefix}`)
  await ctx.register(swagger, opts)
  await ctx.register(swaggerUi, optsUi)
}

export default doc
