const { Client } = require("pg");

const regions = [
  "us-east-1","us-east-2","us-west-1","us-west-2",
  "ca-central-1","eu-west-1","eu-west-2","eu-west-3",
  "eu-central-1","eu-north-1","ap-southeast-1","ap-southeast-2",
  "ap-northeast-1","ap-northeast-2","ap-south-1","sa-east-1"
];

const ref = "aamgyuevwcbtgfgleiwy";
const pw = "Amora301345!";

(async () => {
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    const client = new Client({
      host, port: 5432,
      user: `postgres.${ref}`,
      password: pw,
      database: "postgres",
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log(`✅ FOUND: ${r}`);
      await client.end();
      process.exit(0);
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("tenant") || msg.includes("ENOTFOUND")) {
        process.stdout.write(`❌ ${r}: not here\n`);
      } else {
        console.log(`❓ ${r}: ${msg.slice(0,80)}`);
      }
    }
  }
  console.log("Region not found in any pooler.");
})();
