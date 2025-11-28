import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function validateEnvDatabaseConnection() {
  console.log('🔍 Validating database connection from .env file...');
  
  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('💡 Please ensure .env file exists with DATABASE_URL set');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL found in environment');
  
  // Parse connection details (don't log full URL for security)
  try {
    const url = new URL(databaseUrl);
    console.log(`📊 Connection Details:`);
    console.log(`   Database: ${url.pathname?.replace('/', '') || 'default'}`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port}`);
    console.log(`   User: ${url.username}`);
  } catch (error) {
    console.log('⚠️ Could not parse DATABASE_URL format');
  }
  
  // Test connection
  let prisma: PrismaClient;
  
  try {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
    
    console.log('🔌 Attempting to connect to database...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1 as test, version() as version`;
    console.log('✅ Basic query test passed');
    console.log(`📊 PostgreSQL version: ${(result as any)[0]?.version || 'Unknown'}`);
    
    // Check if tables exist
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const count = (tableCount as any)[0]?.count || 0;
    console.log(`📊 Database tables found: ${count}`);
    
    if (count === 0) {
      console.log('⚠️ No tables found - database may need to be initialized');
      console.log('💡 Run: npm run db:push');
    } else {
      console.log('✅ Database schema exists');
      
      // Check specific tables
      try {
        const orgCount = await prisma.organization.count();
        console.log(`✅ Organizations table accessible: ${orgCount} records`);
        
        const userCount = await prisma.user.count();
        console.log(`✅ Users table accessible: ${userCount} records`);
        
        const empCount = await prisma.employee.count();
        console.log(`✅ Employees table accessible: ${empCount} records`);
        
        if (userCount === 0) {
          console.log('⚠️ No users found - database may need seeding');
          console.log('💡 Run: npm run db:seed');
        }
        
      } catch (error) {
        console.log('⚠️ Some tables may not exist - run npm run db:push');
      }
    }
    
    await prisma.$disconnect();
    console.log('🎉 Database validation completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    if (error instanceof Error) {
      console.log('\n🔍 Error Analysis:');
      
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.log('📍 Issue: Database server not reachable');
        console.log('💡 Solutions:');
        console.log('   1. Check if PostgreSQL is running: pg_isready');
        console.log('   2. Verify host and port in DATABASE_URL');
        console.log('   3. Check firewall settings');
        console.log('   4. Ensure PostgreSQL service is started');
        
      } else if (error.message.includes('authentication failed') || error.message.includes('password authentication failed')) {
        console.log('📍 Issue: Authentication failed');
        console.log('💡 Solutions:');
        console.log('   1. Verify username and password in DATABASE_URL');
        console.log('   2. Check if user exists in PostgreSQL');
        console.log('   3. Ensure user has database access permissions');
        
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.log('📍 Issue: Database does not exist');
        console.log('💡 Solutions:');
        console.log('   1. Create the database: createdb dbname');
        console.log('   2. Check database name in DATABASE_URL');
        console.log('   3. Ensure you have CREATE DATABASE permissions');
        
      } else if (error.message.includes('timeout')) {
        console.log('📍 Issue: Connection timeout');
        console.log('💡 Solutions:');
        console.log('   1. Check network connectivity');
        console.log('   2. Verify PostgreSQL is accepting connections');
        console.log('   3. Check if database server is overloaded');
        
      } else {
        console.log('📍 Issue: Unknown connection error');
        console.log('💡 Solutions:');
        console.log('   1. Verify DATABASE_URL format is correct');
        console.log('   2. Check PostgreSQL logs for details');
        console.log('   3. Try connecting with psql directly');
      }
    }
    
    console.log('\n🛠️ Quick Troubleshooting Commands:');
    console.log('   pg_isready                                    # Check PostgreSQL status');
    console.log('   psql postgresql://user:pass@host:5432/dbname # Test direct connection');
    console.log('   createdb dbname                              # Create database');
    console.log('   npm run db:push                              # Initialize schema');
    
    process.exit(1);
  }
}

// Additional validation functions
async function testDirectConnection() {
  console.log('\n🔍 Testing direct PostgreSQL connection...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('❌ No DATABASE_URL found');
    return;
  }
  
  try {
    // This would require pg package, but we'll use Prisma for now
    console.log('💡 For direct connection testing, install pg package:');
    console.log('   npm install pg');
    console.log('   Then use: psql "your-connection-string"');
    
  } catch (error) {
    console.log('❌ Direct connection test failed:', error);
  }
}

async function showEnvironmentInfo() {
  console.log('\n📊 Environment Information:');
  console.log(`   Node.js: ${process.version}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Better Auth Secret: ${process.env.BETTER_AUTH_SECRET ? '✅ Set' : '❌ Missing'}`);
  
  if (process.env.GOOGLE_CLIENT_ID) {
    console.log(`   Google OAuth: ✅ Configured`);
  }
  if (process.env.GITHUB_CLIENT_ID) {
    console.log(`   GitHub OAuth: ✅ Configured`);
  }
}

// Main execution
if (require.main === module) {
  showEnvironmentInfo();
  validateEnvDatabaseConnection()
    .then(() => {
      console.log('\n✅ All validations completed successfully!');
    })
    .catch((error) => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}

export { validateEnvDatabaseConnection, testDirectConnection, showEnvironmentInfo };
