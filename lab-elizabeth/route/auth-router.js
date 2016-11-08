'use strict';

const request = require('superagent');
const Router = require('express').Router;
const User = require('../model/user.js');
const createError = require('http-errors');
const jsonParser = require('body-parser').json();
const debug = require('debug')('slugram:auth-router');
const basicAuth = require('../lib/basic-auth-middleware.js');
const googleOAUTH = require('../lib/google-oauth-middleware.js');

// module constants
const authRouter = module.exports = Router();

authRouter.post('/api/signup', jsonParser, function(req, res, next){
  debug('POST /api/signup');

  let password = req.body.password;
  delete req.body.password;
  let user = new User(req.body);

  // checkfor password before running generatePasswordHash
  if (!password)
    return next(createError(400, 'requires password'));
  if (password.length < 8)
    return next(createError(400, 'password must be 8 characters'));

  user.generatePasswordHash(password)
  .then( user => user.save()) // check for unique username with mongoose unique
  .then( user => user.generateToken())
  .then( token => res.send(token))
  .catch(next);
});

authRouter.get('/api/login', basicAuth, function(req, res, next){
  debug('GET /api/login');

  User.findOne({username: req.auth.username})
  .then( user => user.comparePasswordHash(req.auth.password))
  .catch(err => Promise.reject(createError(401, err.message)))
  .then( user => user.generateToken())
  .then( token => res.send(token))
  .catch(next);
});

authRouter.get('/api/auth/oauth_callback', function(req, res, next){
  debug('GET /api/auth/oauth_callback');
  //should have either req.googleError or req.googleOAUTH

  console.log('googleError', googleError);
  console.log('googleOAUTH', googleOAUTH);

  //if googleError deal with google error
  if(req.googleError){
    return res.redirect('/?error=access_denied');
  }
  
  //check if user already exists
  User.findOne({email: req.googleOAUTH.email})
  .then(user => {
    if(!user) return Promise.reject(new Error('user not found'));
    return user;
  })
  .catch(err => {
    if (err.message === 'user not found'){
      let userData = {
        username: req.googleOAUTH.email,
        email: req.googleOAUTH.email,
        google: {
          googleID: req.googleOAUTH.googleID,
          tokenTimeToLive: req.googleOAUTH.tokenTimeToLive,
          tokenTimeStamp: Date.now(),
          refreshToken: req.googleOAUTH.refreshToken,
          accessToken: req.googleOAUTH.accessToken,
        },
      };
      return new User(userData).save();
    }
    return Promise.reject(err);
  })
  .then(user => user.generateToken())
  .then(token => {
    res.redirect(`/?token=${token}`);
  });
//   let data = {
//     code: req.query.code,
//     client_id: process.env.GOOGLE_CLIENT_ID,
//     client_secret: process.env.GOOGLE_CLIENT_SECRET,
//     redirect_uri: process.enc.API_URL,
//     grant_type: 'authorization_code',
//   };
//
//   let accessToken, refreshToken, tokenTimeToLive;
//   request.post('https://www.googleapis.com/oauth2/v4/token')
//   .type('form')
//   .send(data)
//   .then(response => {
//     accessToken = response.body.access_token;
//     refreshToken = response.body.refresh_token;
//     tokenTimeToLive = response.body.expires_in;
//     return request.get('https://www.googleapis.com/plus/v1/people/me/openIdConnect')
//     .set('Authorization', `Bearer ${response.body.access_token}`);
//   })
//   .then(response => {
//     let userData = {
//       username: response.body.email,
//       email: response.body.email,
//       google: {
//         googleID: response.body.sub,
//         accessToken,
//         refreshToken,
//         tokenTimeToLive,
//       },
//     };
//     return new User(userData).save();
//   })
//   .then(user => user.generateToken())
//   .then(token => {
//     res.send(token);
//   })
//   .catch(err => {
//     console.error(err);
//     res.send('boo hoo');
//   });
//
//   console.log('req.query', req.query);
//   res.send('lulwat');
});
