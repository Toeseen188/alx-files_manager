const express = require('express');
const router = require('./routes/index');

const app = express();

const PORT = process.env.PORT || 5000;

app.use('/', router);
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server listening at PORT: ${PORT}`);
});
