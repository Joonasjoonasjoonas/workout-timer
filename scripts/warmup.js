import * as https from 'https';

const RENDER_URL = 'https://your-app-url.onrender.com'; // Replace with your actual Render URL

function warmupApp() {
  console.log('Warming up the application...');
  
  https.get(RENDER_URL, (resp) => {
    if (resp.statusCode === 200) {
      console.log('Warmup successful');
    } else {
      console.log('Warmup failed with status:', resp.statusCode);
    }
  }).on('error', (err) => {
    console.log('Warmup failed:', err.message);
  });
}

// Run warmup every 14 minutes
// Render free tier sleeps after 15 minutes of inactivity
setInterval(warmupApp, 14 * 60 * 1000);

// Initial warmup
warmupApp(); 