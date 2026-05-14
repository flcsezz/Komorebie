import postgres from 'postgres';

const sql = postgres('postgresql://postgres:GAURAVBROOO1239@db.gsxexdnjdxwpiptwuqyi.supabase.co:5432/postgres');

async function test() {
  try {
    const res = await sql`SELECT 1`;
    console.log('Success:', res);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
test();
