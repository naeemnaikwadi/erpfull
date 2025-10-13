const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test admin login
async function testAdminLogin() {
  try {
    console.log('🔐 Testing Admin Login...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@skillSync.com',
      password: 'Admin@123'
    });

    if (response.data.token) {
      console.log('✅ Admin login successful');
      console.log('Token:', response.data.token.substring(0, 50) + '...');
      return response.data.token;
    } else {
      console.log('❌ Admin login failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Admin login error:', error.response?.data?.error || error.message);
    return null;
  }
}

// Test dashboard stats
async function testDashboardStats(token) {
  try {
    console.log('\n📊 Testing Dashboard Stats...');
    
    const response = await axios.get(`${BASE_URL}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Dashboard stats retrieved successfully');
    console.log('Stats:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Dashboard stats error:', error.response?.data?.error || error.message);
    return false;
  }
}

// Test user creation
async function testCreateInstructor(token) {
  try {
    console.log('\n👨‍🏫 Testing Instructor Creation...');
    
    const response = await axios.post(`${BASE_URL}/admin/create-instructor`, {
      name: 'Test Instructor',
      email: 'test.instructor@test.com',
      password: 'TestPass123'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Instructor created successfully');
    console.log('Instructor:', response.data.instructor);
    return response.data.instructor._id;
  } catch (error) {
    console.log('❌ Instructor creation error:', error.response?.data?.error || error.message);
    return null;
  }
}

// Test classroom creation
async function testCreateClassroom(token) {
  try {
    console.log('\n🏫 Testing Classroom Creation...');
    
    const response = await axios.post(`${BASE_URL}/admin/classrooms`, {
      name: 'Test Classroom',
      description: 'A test classroom for testing purposes',
      capacity: 25
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Classroom created successfully');
    console.log('Classroom:', response.data.classroom);
    return response.data.classroom._id;
  } catch (error) {
    console.log('❌ Classroom creation error:', error.response?.data?.error || error.message);
    return null;
  }
}

// Test course creation
async function testCreateCourse(token) {
  try {
    console.log('\n📚 Testing Course Creation...');
    
    const response = await axios.post(`${BASE_URL}/admin/courses`, {
      title: 'Test Course',
      description: 'A test course for testing purposes',
      duration: 90,
      difficulty: 'intermediate'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Course created successfully');
    console.log('Course:', response.data.course);
    return response.data.course._id;
  } catch (error) {
    console.log('❌ Course creation error:', error.response?.data?.error || error.message);
    return null;
  }
}

// Test live session creation
async function testCreateLiveSession(token) {
  try {
    console.log('\n🎥 Testing Live Session Creation...');
    
    const response = await axios.post(`${BASE_URL}/admin/live-sessions`, {
      title: 'Test Live Session',
      description: 'A test live session for testing purposes',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 60,
      maxParticipants: 30
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Live session created successfully');
    console.log('Live Session:', response.data.liveSession);
    return response.data.liveSession._id;
  } catch (error) {
    console.log('❌ Live session creation error:', error.response?.data?.error || error.message);
    return null;
  }
}

// Test learning path creation
async function testCreateLearningPath(token) {
  try {
    console.log('\n🛤️ Testing Learning Path Creation...');
    
    const response = await axios.post(`${BASE_URL}/admin/learning-paths`, {
      title: 'Test Learning Path',
      description: 'A test learning path for testing purposes',
      estimatedDuration: 180,
      steps: ['Step 1: Introduction', 'Step 2: Practice', 'Step 3: Assessment']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Learning path created successfully');
    console.log('Learning Path:', response.data.learningPath);
    return response.data.learningPath._id;
  } catch (error) {
    console.log('❌ Learning path creation error:', error.response?.data?.error || error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Admin Dashboard Tests...\n');
  
  // Test admin login
  const token = await testAdminLogin();
  if (!token) {
    console.log('\n❌ Cannot proceed without admin token');
    return;
  }

  // Test dashboard stats
  await testDashboardStats(token);

  // Test creating various entities
  const instructorId = await testCreateInstructor(token);
  const classroomId = await testCreateClassroom(token);
  const courseId = await testCreateCourse(token);
  const liveSessionId = await testCreateLiveSession(token);
  const learningPathId = await testCreateLearningPath(token);

  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Test Summary:');
  console.log(`- Instructor: ${instructorId ? '✅ Created' : '❌ Failed'}`);
  console.log(`- Classroom: ${classroomId ? '✅ Created' : '❌ Failed'}`);
  console.log(`- Course: ${courseId ? '✅ Created' : '❌ Failed'}`);
  console.log(`- Live Session: ${liveSessionId ? '✅ Created' : '❌ Failed'}`);
  console.log(`- Learning Path: ${learningPathId ? '✅ Created' : '❌ Failed'}`);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };


