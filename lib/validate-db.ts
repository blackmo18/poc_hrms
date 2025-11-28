import { prisma } from './db';

async function validateDatabaseConnection() {
  try {
    console.log('🔍 Validating database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic query test passed:', result);
    
    // Test if we can access the database schema
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('✅ Database schema accessible, tables:', tableCount);
    
    // Test organization table specifically
    try {
      const orgCount = await prisma.organization.count();
      console.log(`✅ Organizations table accessible, count: ${orgCount}`);
    } catch (error) {
      console.log('⚠️ Organizations table not found - database may need to be pushed');
    }
    
    await prisma.$disconnect();
    console.log('🎉 Database validation completed successfully');
    
  } catch (error) {
    console.error('❌ Database validation failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.log('💡 Possible solutions:');
        console.log('   1. Check if PostgreSQL is running');
        console.log('   2. Verify DATABASE_URL in .env file');
        console.log('   3. Ensure database exists');
      } else if (error.message.includes('authentication failed')) {
        console.log('💡 Possible solutions:');
        console.log('   1. Check database credentials in DATABASE_URL');
        console.log('   2. Verify user has permissions');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.log('💡 Possible solutions:');
        console.log('   1. Create the database: createdb hr_management');
        console.log('   2. Run npm run db:push to create tables');
      }
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  validateDatabaseConnection();
}

export { validateDatabaseConnection };
