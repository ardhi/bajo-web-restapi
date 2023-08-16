async function error (ctx) {
  const { transformResult } = this.bajoWebRestapi.helper
  ctx.setErrorHandler(async function (err, req, reply) {
    const code = err.statusCode ?? 500
    const msg = err.message
    const data = ctx.httpErrors.createError(code, msg)
    data.statusCode = code
    data.details = err.details
    return await transformResult({ data, req, reply })
  })
}

export default error
