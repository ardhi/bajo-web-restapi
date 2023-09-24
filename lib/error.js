const extHandler = async function (ctx, err, req, reply) {
  const { importModule, getConfig } = this.bajo.helper
  const { transformResult } = this.bajoWebRestapi.helper
  if (err.message === 'notfound' || err.statusCode === 404) {
    const cfg = getConfig('bajoWebRestapi', { full: true })
    const { handler } = await importModule(`${cfg.dir}/lib/not-found.js`, { asDefaultImport: false })
    return await handler.call(this, ctx, req, reply)
  }
  const code = err.statusCode ?? 500
  const msg = err.message
  const data = ctx.httpErrors.createError(code, msg)
  data.statusCode = code
  data.details = err.details
  return await transformResult({ data, req, reply })
}

async function error (ctx) {
  const { importModule, getConfig } = this.bajo.helper
  const cfg = getConfig('bajoWeb', { full: true })
  const errorHandler = await importModule(`${cfg.dir}/lib/error-handler.js`)
  await errorHandler.call(this, ctx, extHandler)
}

export default error
