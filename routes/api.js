'use strict';

var expect = require('chai').expect;
let mongodb = require('mongodb')
let mongoose = require('mongoose')



module.exports = function (app) {
  // Connect to the database in mongoDb
  let uri = "mongodb+srv://hungtp2912:"+ encodeURIComponent(process.env.password)+"@cluster0.sgaqi8v.mongodb.net/stock_price_checker?retryWrites=true&w=majority&appName=Cluster0";
  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true})
  
  // Create the Model and Schema
  let stockSchema = new mongoose.Schema({
    name:{type: String, required: true},
    likes: {type: Number, default: 0},
    ips: [String]
  })

  // Create a model
  let Stock = mongoose.model('Stock', stockSchema)
  app.route('/api/stock-prices')
    .get(function (req, res){
      let response = {}
      response['data'] = {}

      // Determine the number of stock
      let isTwoStock = false

      // Output response
      let outputRes = () => {
        return res.json(response)
      }

      // Function to find and update stock document
      let findOrUpdateStock = (stockName, documentUpdate, next) => {
        Stock.findOneAndUpdate({name: stockName}, 
                                documentUpdate, 
                                {new: true, upsert: true}, 
                                (err, stockDocument) => {
                                  if (err) {
                                    console.log(err)
                                  } else if (!err && stockDocument) {
                                    if(!isTwoStock) {
                                      return next(stockDocument, getOneStock)
                                    }
                                  }
        })
      }

      // Like of stock
      let likeStock = (stockName, next) => {

      }

      // Price of stock
      let priceStock = (stockDocument, next) => {
        next(stockDocument, outputRes)
      }

      // Build response for 1 stock
      let getOneStock = (stockDocument, next) => {
        response['data']['stock'] = stockDocument['name']
        next()
      }

      // Build response for 2 stock
      let getTwoStock = (stockDocument, next) => {

      }

      // Handle input
      if (typeof (req.query.stock) === 'string'){
        // Process with one stock
        let stock = req.query.stock
        let documentUpdate = {}
        findOrUpdateStock(stock, documentUpdate, priceStock)

      } else if (Array.isArray(req.query.stock)){
        isTwoStock = true
        // Process stock 1

        // Process stock 2
      }
    });
    
};
