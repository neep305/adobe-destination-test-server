const express = require('express');
const destinationRouter = require('./routes/destination');
const healthRouter = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/destination', destinationRouter);
app.use('/health', healthRouter);

app.listen(PORT, () => {
  console.log(`RTCDP HTTP API destination test server listening on http://localhost:${PORT}`);
  console.log(`  POST   /destination       <- RTCDP HTTP API destination의 URL로 등록`);
  console.log(`  GET    /destination/logs  <- 수신된 payload 확인`);
  console.log(`  DELETE /destination/logs  <- 로그 초기화`);
  console.log(`  GET    /health            <- health check`);
  console.log(
    process.env.AUTH_TOKEN
      ? '  Auth: Bearer token required on /destination/*'
      : '  Auth: disabled (set AUTH_TOKEN env var to require a Bearer token)'
  );
});
