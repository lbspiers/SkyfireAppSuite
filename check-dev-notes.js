/**
 * Quick script to check if dev notes are saved in the database
 * Usage: node check-dev-notes.js YOUR_AUTH_TOKEN
 */

const https = require('https');

const token = process.argv[2];

if (!token) {
  console.error('Usage: node check-dev-notes.js YOUR_AUTH_TOKEN');
  console.error('\nTo get your token:');
  console.error('1. Open DevTools (F12) in your browser');
  console.error('2. Go to Application tab > Local Storage');
  console.error('3. Find the "token" key and copy its value');
  process.exit(1);
}

const options = {
  hostname: 'api.skyfireapp.io',
  path: '/api/dev-notes',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('\nResponse:');

    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));

      if (json.data && Array.isArray(json.data)) {
        console.log(`\n✅ Found ${json.data.length} dev notes`);
        json.data.forEach((note, idx) => {
          console.log(`\n[${idx + 1}] ID: ${note.id}`);
          console.log(`    Title: ${note.title}`);
          console.log(`    Content: ${note.content?.substring(0, 100)}...`);
          console.log(`    Created: ${note.createdAt}`);
          console.log(`    Status: ${note.status || 'N/A'}`);
        });
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
