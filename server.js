require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet')
const morgan = require('morgan');

const PORT = process.env.PORT || 3001;

const trade = require('./routes/trade.routes');
const portoflio = require('./routes/portoflio.routes');

const app = express();
app.use(express.json())
// app.use(cors());
// app.use(helmet());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
mongoose.connect(process.env.MONGO_URI, { useUnifiedTopology: true, useNewUrlParser: true });

const connection = mongoose.connection;

connection.once("open", function () {
    console.log("MongoDB database connection established successfully");
});

app.listen(PORT, () => {
    console.log(`Server running on localhost ${PORT}`);
});


app.use('/trade', trade);
app.use('/portoflio', portoflio);