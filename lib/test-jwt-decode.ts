import { JWTUtils } from './auth/jwt';

async function testJWTDecode() {
  console.log('🔍 Testing JWT Decode Functionality');
  console.log('=====================================\n');

  try {
    // Create a test token
    const testPayload = {
      userId: '1',
      email: 'admin@techcorp.com',
      organizationId: '1',
      roleIds: ['1'],
      username: 'admin@techcorp.com',
      type: 'access' as const
    };

    const token = JWTUtils.generateAccessToken(testPayload);
    console.log('✅ Generated test token');
    console.log('📝 Token:', token.substring(0, 50) + '...');

    // Test decode without verification
    const decoded = JWTUtils.decodeToken(token);
    if (decoded) {
      console.log('✅ Token decoded successfully');
      console.log('👤 User ID:', decoded.userId);
      console.log('📧 Email:', decoded.email);
      console.log('🏢 Organization ID:', decoded.organizationId);
      console.log('🔑 Role IDs:', decoded.roleIds);
      console.log('👤 Username:', decoded.username);
      console.log('🔖 Token Type:', decoded.type);
    } else {
      console.log('❌ Failed to decode token');
    }

    // Test individual extract functions
    console.log('\n🔍 Testing extraction functions:');
    console.log('👤 Extract User ID:', JWTUtils.extractUserId(token));
    console.log('📧 Extract Email:', JWTUtils.extractEmail(token));
    console.log('🏢 Extract Organization ID:', JWTUtils.extractOrganizationId(token));
    console.log('🔑 Extract Role IDs:', JWTUtils.extractRoleIds(token));
    console.log('👤 Extract Username:', JWTUtils.extractUsername(token));
    console.log('🔖 Is Access Token:', JWTUtils.isTokenType(token, 'access'));
    console.log('🔖 Is Refresh Token:', JWTUtils.isTokenType(token, 'refresh'));

    // Test token expiration
    const expiration = JWTUtils.getTokenExpiration(token);
    console.log('⏰ Token Expiration:', expiration);

    // Test invalid token
    const invalidDecoded = JWTUtils.decodeToken('invalid.token.here');
    console.log('❌ Invalid token decode result:', invalidDecoded);

    console.log('\n🎉 JWT decode functionality test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testJWTDecode();
}

export { testJWTDecode };
