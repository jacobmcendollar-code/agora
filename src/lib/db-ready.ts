/** Static generation only queries Postgres when the build environment has a database. */
export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
