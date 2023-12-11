express = require('express');
routes = require('./routes/index');

app = express();

PORT = process.env.PORT || 5000;

app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Server listening at PORT: ${PORT)`);
  });
