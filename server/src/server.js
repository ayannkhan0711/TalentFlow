const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(config.PORT, () => {
      console.log(`TalentFlow server running on port ${config.PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const fallbackPort = Number(config.PORT) + 1;
        console.warn(
          `Port ${config.PORT} is already in use (e.g. macOS AirPlay Receiver). Attempting fallback port ${fallbackPort}...`
        );
        app.listen(fallbackPort, () => {
          console.log(`TalentFlow server running on fallback port ${fallbackPort}`);
        });
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
