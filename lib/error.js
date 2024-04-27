const extHandler = async function (ctx, err, req, reply) {
  const { importModule } = this.bajo.helper
  const { transformResult } = this.bajoWebRestapi.helper
  if (err.message === 'notfound' || err.statusCode === 404) {
    const { handler } = await importModule('bajoWebRestapi:/lib/not-found.js', { asDefaultImport: false })
    return await handler.call(this, ctx, req, reply)
  }
  const code = err.statusCode ?? 500
  const msg = err.message
  const data = ctx.httpErrors.createError(code, msg)
  data.statusCode = code
  data.details = err.details
  return transformResult({ data, req, reply })
}

async function error (ctx) {
  const { importModule } = this.bajo.helper
  const errorHandler = await importModule('bajoWeb:/lib/error-handler.js')
  await errorHandler.call(this, ctx, extHandler)
}

export default error
