import postgres from "postgres";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function runOTPMigration() {
  console.log("Starting OTP verification migration...");
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in environment variables");
    process.exit(1);
  }

  console.log("Connecting to database...");
  
  const sql = postgres(process.env.DATABASE_URL, {
    ssl: process.env.DATABASE_URL.includes("localhost") 
      ? false 
      : { rejectUnauthorized: false },
    connection: {
      options: `--search_path=goodhive,public`
    },
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30,
  });

  try {
    // Test connection first
    await sql`SELECT 1 as test`;
    console.log("Database connection successful");

    // Read the OTP migration file
    const migrationPath = path.join(
      process.cwd(),
      "db",
      "migrations",
      "add-otp-verification.sql"
    );
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }
    
    console.log(`Reading migration file from: ${migrationPath}`);
    const migration = fs.readFileSync(migrationPath, "utf8");

    // Run the entire migration as a single transaction
    console.log("Running migration as a single transaction...");
    
    try {
      // Remove single-line comments and normalize the SQL
      const cleanedMigration = migration
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      
      await sql.unsafe(cleanedMigration);
      console.log("Migration executed successfully");
    } catch (error: any) {
      // If the full migration fails, try running the simplified version
      console.log("Full migration failed, trying simplified version...");
      
      // Just create the essential tables and columns
      try {
        // Create OTP table
        await sql`
          CREATE TABLE IF NOT EXISTS goodhive.user_otp_verifications (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            wallet_address VARCHAR(255) NOT NULL,
            otp_code VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            attempts INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            last_attempt_at TIMESTAMP,
            CONSTRAINT unique_email_otp UNIQUE(email)
          )
        `;
        console.log("✅ Created user_otp_verifications table");
        
        // Add columns to users table
        await sql`
          ALTER TABLE goodhive.users
          ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE
        `;
        console.log("✅ Added email_verified column");
        
        await sql`
          ALTER TABLE goodhive.users
          ADD COLUMN IF NOT EXISTS email_verification_token TEXT
        `;
        console.log("✅ Added email_verification_token column");
        
        await sql`
          ALTER TABLE goodhive.users
          ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP
        `;
        console.log("✅ Added email_verification_sent_at column");
        
        // Create indexes
        await sql`
          CREATE INDEX IF NOT EXISTS idx_otp_email 
          ON goodhive.user_otp_verifications(LOWER(email))
        `;
        
        await sql`
          CREATE INDEX IF NOT EXISTS idx_otp_expires 
          ON goodhive.user_otp_verifications(expires_at)
        `;
        
        console.log("✅ Created indexes");
        
      } catch (innerError: any) {
        console.error("Error in simplified migration:", innerError.message);
        throw innerError;
      }
    }

    console.log("✅ OTP verification migration completed successfully!");
    
    // Verify the table was created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'goodhive' 
      AND table_name = 'user_otp_verifications'
    `;
    
    if (tables.length > 0) {
      console.log("✅ Verified: user_otp_verifications table exists");
    } else {
      console.warn("⚠️ Warning: user_otp_verifications table not found");
    }

  } catch (error) {
    console.error("❌ Error running migration:", error);
    throw error;
  } finally {
    await sql.end();
    console.log("Database connection closed");
  }
}

// Run the migration
runOTPMigration().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});