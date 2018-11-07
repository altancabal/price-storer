// app.js

const express = require('express')
const sls = require('serverless-http')
const elasticsearch = require('elasticsearch')
const app = express()

//Constants
const FLIGHT_QUOTES_INDEX = 'flightquotes'
const ROUTE_PRICES_INDEX = 'routeprices'

//Serverless
module.exports.server = sls(app)

//Elasticsearch
var client = new elasticsearch.Client( {  
  hosts: [
    process.env.ELASTIC_HOST
  ]
});

//Performs a search of origins in Elasticsearch
const searchOrigins = function searchOrigins() {
  const originsBody = {
    size: 0,
    aggs: {
      origins: {
        terms: {
          field: "originPlace"
        }
      }
    }
  }
  return client.search({index: FLIGHT_QUOTES_INDEX, body: originsBody});
};

//Performs a search of destinations based on Origin Elasticsearch
const searchDestinations = function searchDestinations(origin){
  const destinationsBody = {
    query: {
      match: {
       originPlace: origin
      }
    },
    size: 0,
    aggs: {
      destinations: {
        terms: {
          field: "destinationPlace",
          size:1000
        }
      }
    }
  }
  return client.search({index: FLIGHT_QUOTES_INDEX, body: destinationsBody});
}

const searchRoute = function searchRoute(origin, destination){
  const routeBody = {
    query: {
      bool: {
        must: [
          {
            match: {
              originPlace: origin
            }
          },
          {
            match: {
              destinationPlace: destination
            }
          }
        ]
      }
    }
  }
  return client.search({index: FLIGHT_QUOTES_INDEX, body: routeBody});
}


const processOrigin = function processOrigin(origin){
  searchDestinations(origin)
  .then( results => {
    console.log("Origin: "+origin)
    let destinations = results.aggregations.destinations.buckets
    let destinationsLength = destinations.length
    for (var i = 0; i < destinationsLength; i++) {
      let destination = destinations[i].key
      console.log("Destination: " + destination)
      processRoute(origin, destination) 
    }
  })
  .catch(console.error)
}

const processRoute = function processRoute(origin, destination){
  searchRoute(origin, destination)
  .then( results => {
    console.log("Route from: "+origin+", to: "+destination)
    let routeOptions = results.hits.hits;
    let routeOptionsLength = routeOptions.length
    let lowestPrice
    for (var i = 0; i < routeOptionsLength; i++) {
      let routePrice = routeOptions[i]._source.price
      if(lowestPrice == null){
        lowestPrice = routePrice
      }
      else if(lowestPrice > routePrice){
        lowestPrice = routePrice
      }
    }
    storeRoutePrice(origin, destination, lowestPrice)
  })
  .catch(console.error)
}

const storeRoutePrice = function storeRoutePrice(origin, destination, price){
  console.log("The route with origin: "+origin+", destination: "+destination+", has the price: "+price+" in the date: "+new Date())
  client.index({
    index: ROUTE_PRICES_INDEX,
    type: 'doc',
    body: {
      "originPlace": origin,
      "destinationPlace": destination,
      "price": price,
      "date": new Date()
    }
  }), function(err, res, status){
    console.log(res)
  }
}

app.get('/', async (req, res, next) => {
  let hello = '';
  searchOrigins()
  .then(results => {
    console.log(`found ${results.hits.total} items in ${results.took}ms`);
    console.log(`found ${results.aggregations.origins.buckets.length} origins`);
    let origins = results.aggregations.origins.buckets
    let originsLength = origins.length
    for (var i = 0; i < originsLength; i++) {
      processOrigin(origins[i].key)      
    }
    res.status(200).send(results)
  })
  .catch(console.error);
})