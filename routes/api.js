'use strict';

var expect = require('chai').expect
let mongodb = require('mongodb')
let mongoose = require('mongoose')
let httpRequest = require("xmlhttprequest").XMLHttpRequest


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
                                {new: true, upsert: true}).then(result => {
                                  if (!isTwoStock && result) {
                                    return next(result, getOneStock)
                                  } else if (isTwoStock && result){
                                    return next(result, getTwoStock)
                                  }
                                })
      }

      // Like of stock
      let likeStock = async (stockName, next) => {
        await Stock.findOne({name: stockName}).then(stock => {
          console.log('Like stock')
          console.log(req.ip)
          if(stock && stock['ips'] && stock['ips'].includes(req.ip)) {
            return res.send('Error: Only 1 like per IP allowed')
          } else {
            let docUpdate = {$inc: {likes: 1}, $push: {ips: req.ip}}
            next(stockName, docUpdate, priceStock)
          }
        })        
      }

      // Price of stock
      let priceStock = (stockDocument, next) => {
        let httpReq = new httpRequest()
        let url = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/'+ stockDocument['name'].toUpperCase()+'/quote'
        httpReq.open('GET', url, true)
        httpReq.onload = () => {
          let apiRes = JSON.parse(httpReq.responseText)
          console.log('Loading...')
          stockDocument['price'] = apiRes['latestPrice']
          console.log(stockDocument)
          next(stockDocument, outputRes)
        }
        httpReq.send()
      }

      // Build response for 1 stock
      let getOneStock = (stockDocument, next) => {
        console.log('Loading...3')
        response['data']['stock'] = stockDocument['name'].toUpperCase()
        response['data']['price'] = stockDocument['price']
        response['data']['likes'] = stockDocument['likes']
        next()
      }

      let stocks = []
      // Build response for 2 stock
      let getTwoStock = (stockDocument, next) => {
        let newStock = {}
        newStock['stock'] = stockDocument['name'].toUpperCase()
        newStock['price'] = stockDocument['price']
        newStock['likes'] = stockDocument['likes']
        stocks.push(newStock)
        if(stocks.length === 2) {
          stocks[0]['rel_likes'] = stocks[0]['likes'] - stocks[1]['likes']
          stocks[1]['rel_likes'] = stocks[1]['likes'] - stocks[0]['likes']
          response['data'] = stocks
          next()
        } else {
          return
        }
      }

      // Handle input
      if (typeof (req.query.stock) === 'string'){
        // Process with one stock
        let stock = req.query.stock.toUpperCase()

        if(req.query.like && req.query.like == 'true'){
          likeStock(stock, findOrUpdateStock)
        } else {
          let documentUpdate = {}
          findOrUpdateStock(stock, documentUpdate, priceStock)
        }
      } else if (Array.isArray(req.query.stock)){
        isTwoStock = true
        // Process stock 1
        let firstStock = req.query.stock[0].toUpperCase()
        if(req.query.like && req.query.like == 'true'){
          likeStock(firstStock, findOrUpdateStock)
        } else {
          let documentUpdate = {}
          findOrUpdateStock(firstStock, documentUpdate, priceStock)
        }
        // Process stock 2
        let secondStock = req.query.stock[1].toUpperCase()
        if(req.query.like && req.query.like == 'true'){
          likeStock(secondStock, findOrUpdateStock)
        } else {
          let documentUpdate = {}
          findOrUpdateStock(secondStock, documentUpdate, priceStock)
        }
      }
    });    
};
