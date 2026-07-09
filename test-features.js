const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';

async function testAll() {
  console.log('--- STARTING FEATURE VERIFICATION ---');

  try {
    // 1. Test Auth & Registration
    console.log('\n1. Testing User Registration...');
    const userEmail = `testuser_${Date.now()}@smartmoney.com`;
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      firstName: 'Test',
      lastName: 'User',
      email: userEmail,
      password: 'password123',
      userType: 'both'
    });
    console.log('✓ Registration successful');
    token = regRes.data.token;
    userId = regRes.data.user.id;

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Test Gigs API
    console.log('\n2. Testing Gig Scout API...');
    const gigRes = await axios.post(`${API_URL}/gigs`, {
      title: 'Chemistry Tutor Needed',
      description: 'Need help with organic chemistry labs.',
      budget: 150,
      category: 'academic'
    }, authHeader);
    console.log('✓ Gig creation successful:', gigRes.data.title);

    const allGigs = await axios.get(`${API_URL}/gigs`);
    console.log(`✓ Gig retrieval successful: Found ${allGigs.data.length} gigs`);

    // 3. Test Loans API
    console.log('\n3. Testing Loans API...');
    const loanRes = await axios.post(`${API_URL}/loans`, {
      borrowerId: userId,
      amount: 1000,
      interestRate: 10,
      loanTerm: 30,
      paymentPeriod: 30,
      collateralValue: 2000,
      purpose: 'Tuition'
    }, authHeader);
    console.log('✓ Loan request creation successful:', loanRes.data.loanId);

    // 4. Test QR Code Generation
    console.log('\n4. Testing QR Code Generation...');
    // Simulate accepting the loan to generate QR
    const acceptRes = await axios.put(`${API_URL}/loans/${loanRes.data._id}/accept`, {
      lenderId: userId // Testing with self for simplicity
    }, authHeader);

    if (acceptRes.data.qrCode) {
      console.log('✓ QR Code generated successfully');
    } else {
      console.log('✗ QR Code missing in response');
    }

    console.log('\n--- ALL BACKEND FEATURES VERIFIED ---');
  } catch (error) {
    console.error('✗ Test failed:', error.response?.data?.error || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('! Error: Backend server is not running on http://localhost:5000');
    }
  }
}

testAll();
