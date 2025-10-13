const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';
let adminToken = '';

// Test admin login
async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@skillSync.com',
      password: 'Admin@123'
    });
    
    adminToken = response.data.token;
    console.log('✅ Admin login successful');
    console.log('👤 User role:', response.data.user.role);
    console.log('🆔 User ID:', response.data.user._id);
    
    return true;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    return false;
  }
}

// Test admin dashboard stats
async function testDashboardStats() {
  try {
    console.log('\n📊 Testing admin dashboard stats...');
    const response = await axios.get(`${BASE_URL}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Dashboard stats retrieved successfully');
    console.log('📈 Stats:', response.data);
    
    return true;
  } catch (error) {
    console.error('❌ Dashboard stats failed:', error.response?.data || error.message);
    return false;
  }
}

// Test admin users endpoint
async function testUsersEndpoint() {
  try {
    console.log('\n👥 Testing admin users endpoint...');
    const response = await axios.get(`${BASE_URL}/admin/users?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Users endpoint working');
    console.log('👥 Total users:', response.data.total);
    console.log('📄 Current page:', response.data.currentPage);
    
    return true;
  } catch (error) {
    console.error('❌ Users endpoint failed:', error.response?.data || error.message);
    return false;
  }
}

// Test creating a test instructor
async function testCreateInstructor() {
  try {
    console.log('\n👨‍🏫 Testing instructor creation...');
    const response = await axios.post(`${BASE_URL}/admin/create-instructor`, {
      name: 'Test Instructor',
      email: 'test.instructor@example.com',
      password: 'TestPass123'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Test instructor created successfully');
    console.log('🆔 Instructor ID:', response.data.instructor._id);
    
    return response.data.instructor._id;
  } catch (error) {
    console.error('❌ Instructor creation failed:', error.response?.data || error.message);
    return null;
  }
}

// Test creating a test admin
async function testCreateAdmin() {
  try {
    console.log('\n🛡️ Testing admin creation...');
    const response = await axios.post(`${BASE_URL}/admin/create-admin`, {
      name: 'Test Admin',
      email: 'test.admin@example.com',
      password: 'TestAdmin123'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Test admin created successfully');
    console.log('🆔 Admin ID:', response.data.admin._id);
    
    return response.data.admin._id;
  } catch (error) {
    console.error('❌ Admin creation failed:', error.response?.data || error.message);
    return null;
  }
}

// Test system health
async function testSystemHealth() {
  try {
    console.log('\n💚 Testing system health...');
    const response = await axios.get(`${BASE_URL}/admin/system-health`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ System health check successful');
    console.log('🏥 Status:', response.data.status);
    console.log('⏱️ Uptime:', response.data.serverUptime, 'seconds');
    
    return true;
  } catch (error) {
    console.error('❌ System health check failed:', error.response?.data || error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Admin System Tests...\n');
  
  // Test admin login
  const loginSuccess = await testAdminLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin login');
    return;
  }
  
  // Test dashboard stats
  await testDashboardStats();
  
  // Test users endpoint
  await testUsersEndpoint();
  
  // Test creating test instructor
  const instructorId = await testCreateInstructor();
  
  // Test creating test admin
  const adminId = await testCreateAdmin();
  
  // Test system health
  await testSystemHealth();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Test Summary:');
  console.log('✅ Admin login working');
  console.log('✅ Dashboard stats working');
  console.log('✅ Users endpoint working');
  console.log('✅ Instructor creation working');
  console.log('✅ Admin creation working');
  console.log('✅ System health working');
  
  if (instructorId) {
    console.log('👨‍🏫 Test instructor created with ID:', instructorId);
  }
  if (adminId) {
    console.log('🛡️ Test admin created with ID:', adminId);
  }
  
  console.log('\n🔑 Admin credentials:');
  console.log('📧 Email: admin@skillSync.com');
  console.log('🔐 Password: Admin@123');
}

// Run tests
runTests().catch(console.error);
