const bcrypt = require('bcryptjs');

// The stored hash from the database
const storedHash = '$2a$04$5hrgO10szswT4pmC2nd6JeJTMFoiopv3lB2x.5BNDJNS7YcC.RBN6';
const password = '123456';

async function testPassword() {
  try {
    console.log('Testing password comparison...');
    console.log('Password:', password);
    console.log('Stored hash:', storedHash);
    
    // Test if the password matches
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log('Password match result:', isMatch);
    
    // Test creating a new hash with the same cost factor (4)
    const newHashWithCost4 = await bcrypt.hash(password, 4);
    console.log('New hash with cost 4:', newHashWithCost4);
    
    // Test if the new hash matches
    const isNewMatch = await bcrypt.compare(password, newHashWithCost4);
    console.log('New hash match result:', isNewMatch);
    
    // Test creating a hash with current cost factor (12)
    const newHashWithCost12 = await bcrypt.hash(password, 12);
    console.log('New hash with cost 12:', newHashWithCost12);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPassword();
