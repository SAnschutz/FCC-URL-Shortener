'use strict';

const express = require('express');

const http = require('http');
const mongo = require('mongodb');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const validator = require('validator');


const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.connect(process.env.MONGODB_URI);
mongoose.Promise = global.Promise;
const db = mongoose.connection;

const Schema = mongoose.Schema;

const URLSchema = new Schema({
  longURL: {
    required: true,
    type: String
  },
  recordNumber: {
    required: true,
    type: Number,
    unique: true
  },
  shortURL: {
    required: true,
    type: String,
    unique: true
  }
});

const URLPair = mongoose.model('URLPair', URLSchema);


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


app.post('/api/shorturl/new', function(req, res){

  const longURL = req.body.url;
  const validURL = validator.isURL(longURL);
  
  if(!validURL) {
    return res.send("invalid URL");
  };
  
  URLPair.findOne({longURL}).then((results) => {
    if (results){
      
      const shortURL = results.shortURL;
      res.send({shortURL});

    } else {

      URLPair.find()
        .sort({recordNumber: 'asc'})
        .then((results) => {
          const oldRecordNumber = results[results.length-1].recordNumber;
          const newRecordNumber = oldRecordNumber + 1;

          const newURLpair =  new URLPair({
            longURL,
            recordNumber: newRecordNumber,
            shortURL: `https://plucky-effect.glitch.me/api/shorturl/${newRecordNumber}`
          });


          newURLpair.save(function(err, doc) {
            if (err) {
              return (err);
            };
            const shortURL = doc.shortURL;
            res.send({shortURL});
          });
        });
    };
  });  
});


app.get("/api/shorturl/:recordNumber", function(req, res){
  const reqParamsNumber = req.params.recordNumber;
  console.log(reqParamsNumber);
  
  URLPair.find({recordNumber: reqParamsNumber}).then(function(result){
    if (result.length < 1) {
      return res.send("No record found");
    };
    const targetURL = result[0].longURL;
    res.redirect(targetURL);
  });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
