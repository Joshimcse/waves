/**
 * server.js
 *
 * @description :: Main Server file also Entry point
 * @author      :: Joshim Uddin
 */
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser'); 


// set up express app
const app = express();


// configure morgan for loggin
app.use(require('morgan')('dev'));
// .env configuration
require('dotenv').config();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
// parse cookies
app.use(cookieParser());
// set up mongoose promise as global
mongoose.Promise = global.Promise;


app.use(express.static('client/build'))

// initialize users routes
app.use('/', require('./routes/userRoutes'));
// initialize foods routes
app.use('/', require('./routes/productRoutes'));
// initialize users routes
app.use('/', require('./routes/brandRoutes'));
// initialize foods routes
app.use('/', require('./routes/woodRoutes'));
// initialize foods routes
app.use('/', require('./routes/siteRoutes'));

// default functionality
if( process.env.NODE_ENV === 'production' ){
    const path = require('path');
    app.get('/*',(req,res)=>{
        res.sendfile(path.resolve(__dirname,'../client','build','index.html'))
    })
}

// listen for request
const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Magic happens on port ${port}`);
  // Load DB
  const db = process.env.MONGODB_URI;
  // MongoDB configuration
  mongoose.connect(
    db,  (err, res) => {
      if (err) console.error(err);
      else console.log('Connected to Database');
    }
  );
});