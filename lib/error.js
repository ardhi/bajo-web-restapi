async function error (ctx) {
  const { transformResult } = this.bajoWebRestapi.helper
  const { getConfig } = this.bajo.helper
  const cfg = getConfig('bajo')
  ctx.setErrorHandler(async function (err, req, reply) {
    if (err.redirect) {
      reply.redirect(err.redirect)
      return
    }
    const code = err.statusCode ?? 500
    const msg = err.message
    const data = ctx.httpErrors.createError(code, msg)
    data.statusCode = code
    data.details = err.details
    if (cfg.log.level === 'trace') console.log(err)
    return await transformResult({ data, req, reply })
  })
}

export default error
