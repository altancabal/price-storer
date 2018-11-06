// app.js

const express = require('express')
const sls = require('serverless-http')
var elasticsearch = require('elasticsearch')

var client = new elasticsearch.Client( {  
  hosts: [
    process.env.ELASTIC_HOST
  ]
});

client.cluster.health({},function(err,resp,status) {  
  console.log("-- Client Health --",resp);
});

const search = function search(index, body) {
  return client.search({index: index, body: body});
};

const app = express()
app.get('/', async (req, res, next) => {
  let body = {
    size: 20,
    from: 0,
    query: {
      match_all: {}
    }
  };
  let hello = '';
  search('flightquotes', body)
  .then(results => {
    console.log(`found ${results.hits.total} items in ${results.took}ms`);
    hello = `found ${results.hits.total} items in ${results.took}ms`;
    res.status(200).send(results)
    console.log(`returned article titles:`);
    results.hits.hits.forEach(
      (hit, index) => console.log(
        `\t${body.from + ++index} - ${hit._source.title}`
      )
    )
  })
  .catch(console.error);
})
module.exports.server = sls(app)