const express = require('express');
const UserRoutes = require('./routes/user');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use('/user', UserRoutes);
app.listen(3000);
