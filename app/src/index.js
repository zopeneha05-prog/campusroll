const { createApp } = require('./app');

const port = Number(process.env.PORT || 3000);
const server = createApp().listen(port, () => {
  console.log(`CampusRoll ${process.env.APP_VERSION || 'dev'} listening on port ${port}`);
});

// graceful shutdown so rolling updates don't drop requests
process.on('SIGTERM', () => server.close(() => process.exit(0)));
