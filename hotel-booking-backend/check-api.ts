import http from 'http';

async function checkAPI() {
  try {
    const options = {
      hostname: 'localhost',
      port: 7002,
      path: '/api/hotels',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const hotels = JSON.parse(data);
          console.log('API Response:');
          hotels.forEach((hotel: any, index: number) => {
            console.log(`Hotel ${index + 1}:`, {
              name: hotel.name,
              dayRate: hotel.dayRate,
              nightRate: hotel.nightRate,
              hasDayRate: hotel.hasDayRate,
              hasNightRate: hotel.hasNightRate
            });
          });
          process.exit(0);
        } catch (parseError) {
          console.error('Parse Error:', parseError);
          console.log('Raw data:', data.substring(0, 500));
          process.exit(1);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request Error:', error);
      process.exit(1);
    });

    req.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAPI();
