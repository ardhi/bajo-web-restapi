async function transformResult (data, forFind) {
  const { getConfig, importPkg } = this.bajo.helper
  const { get, forOwn } = await importPkg('lodash-es')
  const cfg = getConfig('bajoWebRestapi')
  const newData = {}
  forOwn(data, (v, k) => {
    let key = get(cfg, `key.response.${k}`, k)
    if (forFind && k === 'data') key = get(cfg, 'key.response.rows')
    newData[key] = v
  })
  return newData
}

export default transformResult
