import { Pool } from '@neondatabase/serverless';

// Configuration from your environment
const DATABASE_URL = "postgresql://neondb_owner:npg_ZfwA1zgbSQE4@ep-frosty-credit-aifplu16-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

// Use environment variable if available, otherwise fallback to the hardcoded one (for demo purposes)
const connectionString = (typeof process !== 'undefined' && process.env.DATABASE_URL) 
    ? process.env.DATABASE_URL 
    : ((import.meta as any).env?.VITE_DATABASE_URL || DATABASE_URL);

const pool = new Pool({ connectionString });

export default pool;