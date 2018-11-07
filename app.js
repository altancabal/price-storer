// app.js

const express = require('express')
const sls = require('serverless-http')
const elasticsearch = require('elasticsearch')
const app = express()
const FLIGHT_QUOTES_INDEX = 'flightquotes'
let GET_ORIGINS_BODY = {
  size: 20,
  from: 0,
  query: {
    match_all: {}
  }
}; 

module.exports.server = sls(app)

var client = new elasticsearch.Client( {  
  hosts: [
    process.env.ELASTIC_HOST
  ]
});

//Performs a search in Elasticsearch
const search = function search(index, body) {
  return client.search({index: index, body: body});
};


app.get('/', async (req, res, next) => {
  let hello = '';
  search(FLIGHT_QUOTES_INDEX, GET_ORIGINS_BODY)
  .then(results => {
    console.log(`found ${results.hits.total} items in ${results.took}ms`);
    hello = `found ${results.hits.total} items in ${results.took}ms`;
    res.status(200).send(results)
  })
  .catch(console.error);
})