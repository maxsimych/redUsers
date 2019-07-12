const app = require('./src/app');

(async () => {
  await app.listen(3000);
  console.log('listening port 3000');
})();
