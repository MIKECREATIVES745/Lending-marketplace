const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAuth() {
  try {
    // Try login first
    console.log('Testing login...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'john@test.com',
        password: 'password123'
      });
      console.log('✓ Login successful');
      console.log('User:', loginResponse.data.user);
      console.log('Token:', loginResponse.data.token);
    } catch (loginErr) {
      if (loginErr.response?.data?.error?.includes('Invalid credentials')) {
        console.log('User not found, registering...');
        const regResponse = await axios.post(`${API_URL}/auth/register`, {
          firstName: 'John',
          lastName: 'Doe',
          email: `john${Date.now()}@test.com`,
          password: 'password123',
          userType: 'both',
          phone: '0976123456',
          programOfStudy: 'Computer Science',
          computerNumber: 'C001'
        });
        console.log('✓ Registration successful');
        console.log('Token:', regResponse.data.token);
      } else {
        throw loginErr;
      }
    }
  } catch (error) {
    console.error('✗ Error:', error.response?.data?.error || error.message);
  }
}

testAuth();
