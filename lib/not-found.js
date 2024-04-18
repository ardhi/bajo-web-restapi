export async function handler (ctx, req, reply) {
  const { print } = this.bajo.helper
  const { transformResult } = this.bajoWebRestapi.helper
  const msg = print.__('Route \'%s (%s)\' not found', req.url, req.method)
  const data = ctx.httpErrors.createError(404, msg)
  return transformResult({ data, req, reply })
}

async function notFound (ctx) {
  const me = this
  await ctx.setNotFoundHandler(async function (req, reply) {
    return await handler.call(me, ctx, req, reply)
  })
}

export default notFound
