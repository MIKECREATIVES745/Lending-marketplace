const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

async function testFileUpload() {
  try {
    // First, login to get a user ID
    console.log('Testing file upload...\n');
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'john@test.com',
      password: 'password123'
    });
    const userId = loginResponse.data.user.id;
    console.log(`✓ Logged in as: ${loginResponse.data.user.email}`);

    // Create a test image
    console.log('\n2. Creating test files...');
    const testImagePath = path.join(__dirname, 'test-image.txt');
    const testDocPath = path.join(__dirname, 'test-doc.txt');
    
    fs.writeFileSync(testImagePath, 'This is a test image file');
    fs.writeFileSync(testDocPath, 'This is a test document file');
    console.log('✓ Test files created');

    // Upload collateral with files
    console.log('\n3. Uploading collateral with files...');
    const form = new FormData();
    form.append('userId', userId);
    form.append('itemName', 'Test Laptop');
    form.append('category', 'electronics');
    form.append('estimatedValue', '5000');
    form.append('description', 'A test laptop for upload testing');
    form.append('condition', 'good');
    
    // Add files
    form.append('files', fs.createReadStream(testImagePath), 'test-image.txt');
    form.append('files', fs.createReadStream(testDocPath), 'test-doc.txt');

    const uploadResponse = await axios.post(`${API_URL}/collateral`, form, {
      headers: form.getHeaders()
    });

    console.log('✓ Collateral uploaded successfully');
    console.log('✓ Images:', uploadResponse.data.images);
    console.log('✓ Documents:', uploadResponse.data.documents);

    // Retrieve the collateral
    console.log('\n4. Retrieving user collateral...');
    const retrieveResponse = await axios.get(`${API_URL}/collateral/user/${userId}`);
    console.log(`✓ Found ${retrieveResponse.data.length} collateral item(s)`);
    console.log(`✓ Latest item: ${retrieveResponse.data[retrieveResponse.data.length - 1].itemName}`);

    // Clean up test files
    fs.unlinkSync(testImagePath);
    fs.unlinkSync(testDocPath);
    
    console.log('\n✓ All file upload tests passed!');
  } catch (error) {
    console.error('✗ Error:', error.response?.data?.error || error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

testFileUpload();
