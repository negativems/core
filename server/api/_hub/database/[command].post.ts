const statementValidation = z.object({
  query: z.string().min(1).max(1e6).trim(),
  params: z.any().array(),
})

export default eventHandler(async (event) => {
  // https://developers.cloudflare.com/d1/build-databases/query-databases/
  const { command } = await getValidatedRouterParams(event, z.object({
    command: z.enum(['first', 'all', 'raw', 'run', 'dump', 'exec', 'batch'])
  }).parse)
  const db = useDatabase()

  if (command === 'exec') {
    const { query } = await readValidatedBody(event, z.object({
      query: z.string().min(1).max(1e6).trim()
    }).parse)
    return db.exec(query)
  }
  if (command === 'dump') {
    return db.dump()
  }
  if (command === 'first') {
    const { query, params, colName } = await readValidatedBody(event, z.object({
      query: z.string().min(1).max(1e6).trim(),
      params: z.any().array(),
      colName: z.string().optional()
    }).parse)
    return db.prepare(query).bind(...params).first(colName)
  }

  if (command === 'batch') {
    const statements = await readValidatedBody(event, z.array(statementValidation).parse)
    return db.batch(
      statements.map(stmt => db.prepare(stmt.query).bind(...stmt.params))
    )
  }
  // command is all, raw or run
  const { query, params } = await readValidatedBody(event, statementValidation.parse)
  return db.prepare(query).bind(...params)[command]()
})
