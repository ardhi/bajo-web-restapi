async function notFound (ctx) {
  const { print } = this.bajo.helper
  const { transformResult } = this.bajoWebRestapi.helper
  await ctx.setNotFoundHandler(async function (req, reply) {
    const msg = print.__('Route \'%s (%s)\' not found', req.url, req.method)
    const data = ctx.httpErrors.createError(404, msg)
    return await transformResult({ data, req, reply })
  })
}

export default notFound
