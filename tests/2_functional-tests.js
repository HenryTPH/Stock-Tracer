const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
let mongoose = require('mongoose')

chai.use(chaiHttp);

suite('Functional Tests', function() {
    test('1 stock', function(done){
        chai.request(server)
            .get('/api/stock-prices')
            .query({stock: 'goog'})
            .end((err, res) => {
                assert.equal(res.body['data']['stock'], 'goog'.toUpperCase())
                assert.isNotNull(res.body['data']['price'])
                assert.isNotNull(res.body['data']['likes'])
                done()
            })
    })

    test('1 stock with like', (done) => {
        chai.request(server)
            .get('/api/stock-prices')
            .query({stock: 'aapl', like: true})
            .end((err, res) => {
                assert.equal(res.body['data']['stock'], 'aapl'.toUpperCase())
                assert.equal(res.body['data']['likes'], 1)
                console.log('One stock with like')
                console.log(res.body)
                done()
            })
    })
    test('1 stock with like again ensure likes do not double counted', (done) => {
        chai.request(server)
            .get('/api/stock-prices')
            .query({stock: 'aapl', like: true})
            .end((err, res) => {
                assert.equal(res.text, 'Error: Only 1 like per IP allowed')
                done()
            })
    })
    test('2 stocks', (done) => {
        chai.request(server)
            .get('/api/stock-prices')
            .query({stock: ['aapl', 'amzn']})
            .end((err, res) => {
                let stockData = res.body['data']
                if(stockData[0]['stock'] === 'aapl'.toUpperCase()) {
                    assert.equal(stockData[0]['stock'], 'aapl'.toUpperCase())
                    assert.equal(stockData[0]['likes'], 1)
                    assert.equal(stockData[0]['rel_likes'], 1)
                    assert.equal(stockData[1]['stock'], 'amzn'.toUpperCase())
                    assert.equal(stockData[1]['likes'], 0)
                    assert.equal(stockData[1]['rel_likes'], -1)
                } else {
                    assert.equal(stockData[1]['stock'], 'aapl'.toUpperCase())
                    assert.equal(stockData[1]['likes'], 1)
                    assert.equal(stockData[1]['rel_likes'], 1)
                    assert.equal(stockData[0]['stock'], 'amzn'.toUpperCase())
                    assert.equal(stockData[0]['likes'], 0)
                    assert.equal(stockData[0]['rel_likes'], -1)
                }
                done()
            })
    })
    test('2 stock with like', (done) => {
        chai.request(server)
            .get('/api/stock-prices')
            .query({stock: ['spot', 'amzn'], like: true})
            .end((err, res) => {
                let stockData = res.body['data']
                if(stockData[0]['stock'] === 'spot'.toUpperCase()) {
                    assert.equal(stockData[0]['stock'], 'spot'.toUpperCase())
                    assert.equal(stockData[0]['likes'], 1)
                    assert.equal(stockData[0]['rel_likes'], 0)
                    assert.equal(stockData[1]['stock'], 'amzn'.toUpperCase())
                    assert.equal(stockData[1]['likes'], 1)
                    assert.equal(stockData[1]['rel_likes'], 0)
                } else {
                    assert.equal(stockData[1]['stock'], 'spot'.toUpperCase())
                    assert.equal(stockData[1]['likes'], 1)
                    assert.equal(stockData[1]['rel_likes'], 0)
                    assert.equal(stockData[0]['stock'], 'amzn'.toUpperCase())
                    assert.equal(stockData[0]['likes'], 1)
                    assert.equal(stockData[0]['rel_likes'], 0)
                }
                done()
            })
    })
});
