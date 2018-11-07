# price-storer
Store current price for a route into a historical price store

# Requirements
* Node.js 8.10
* The following environment variables:
...* ELASTIC_HOST: The host for Elasticsearch

# Install
```
npm install
```

# Deploy
```
sls deploy
```

# How this code was generated
The code was generated using the following guide: https://dev.to/adnanrahic/how-to-deploy-a-nodejs-application-to-aws-lambda-using-serverless-2nc7
```
npm install -g serverless
sls config credentials --provider aws --key PUBLIC_KEY --secret SECRET_KEY
mkdir price-storer && cd price-storer
sls create -t aws-nodejs -n price-storer
npm init -y
npm install --save express serverless-http elasticsearch
```
Rename `handle.js` to `app.js`
Replace the code in it with the following code:
```
// app.js

const express = require('express')
const sls = require('serverless-http')
const app = express()
app.get('/', async (req, res, next) => {
  res.status(200).send('Hello World!')
})
module.exports.server = sls(app)
```
Replace the code in `serverless.yml` with the following code:
```
# serverless.yml

service: price-storer

provider:
  name: aws
  runtime: nodejs8.10
  stage: dev
  region: us-east-1

functions:
  app:
    handler: app.server # reference the file and exported method
    events: # events trigger lambda functions
      - http: # this is an API Gateway HTTP event trigger
          path: /
          method: ANY
          cors: true
      - http: # all routes get proxied to the Express router
          path: /{proxy+}
          method: ANY
          cors: true
```
