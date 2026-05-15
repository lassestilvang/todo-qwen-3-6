declare module 'bun:sqlite' {
  interface DatabaseOptions {
    create?: boolean
    readonly?: boolean
    fileMustExist?: boolean
  }

  interface RunResult {
    changes: number
    lastInsertRowid: number | bigint
  }

  interface Statement {
    run(...values: unknown[]): RunResult
    get(...values: unknown[]): unknown
    all(...values: unknown[]): unknown[]
    values(...values: unknown[]): unknown[][]
    iterate(...values: unknown[]): Iterable<unknown>
  }

  export class Database {
    constructor(path: string, options?: DatabaseOptions | boolean)
    exec(sql: string): void
    query(sql: string): Statement
    prepare(sql: string): Statement
    close(): void
  }
}
