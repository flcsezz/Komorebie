import postgres from 'postgres';
const sql = postgres('postgresql://postgres.gsxexdnjdxwpiptwuqyi:GAURAVBROOO1239@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require');
async function run() {
  try {
    const res = await sql`SELECT * FROM profiles LIMIT 1`;
    console.log(res);
  } catch(e) {
    console.error(e);
  }
  await sql.end();
}
run();
