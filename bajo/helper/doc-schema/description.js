const desc = {
  create: 'Post a new record',
  find: 'Find records by query, page size and number.',
  get: 'Get record by ID',
  update: 'Update record by ID',
  remove: 'Remove record by ID'
}

function docDescription (method) {
  const { print } = this.bajo.helper
  return print.__(desc[method])
}

export default docDescription
