'use strict';

const request = require('superagent');
const debug = require('debug')('bookstagram:google-oauth-middleware');

console.log(process.env.API_URL, 'lulwaaaaaat');

module.exports = function(req, res, next){
  debug('getting google user info');
  if(req.query.error){
    console.log('sdfkaodbiajglawekfacblihadlkjgaldkvjba');
    console.log(req.query.error, 'something else');
    req.googleError = new Error(req.query.error);
    return next();
  }
  console.log('lulwat');
  let data = {
    code: req.query.code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: `${process.env.API_URL}/api/auth/oauth_callback`,
    grant_type: 'authorization_code',
  };

  let accessToken, refreshToken, tokenTimeToLive;
  request.post('https://www.googleapis.com/oauth2/v4/token')
  .type('form')
  .send(data)
  .then(response => {
    console.log(response, 'line 26');
    accessToken = response.body.access_token;
    refreshToken = response.body.refresh_token;
    tokenTimeToLive = response.body.expires_in;
    return request.get('https://www.googleapis.com/plus/v1/people/me/openIdConnect')
    .set('Authorization', `Bearer ${response.body.access_token}`);
  })
  .catch(err => {
    console.log('guubar');
    return Promise.reject(err);
  })
  .then(response => {
    console.log(response);
    // debug('response.body', response.body);
    req.googleOAUTH = {
      googleID: response.body.sub,
      email: response.body.email,
      accessToken,
      refreshToken,
      tokenTimeToLive,
    };
    next();
  })
  .catch(err => {
    console.log(err);
    req.googleError = err;
    console.log('a bark from a shark for a lark in the park while it\'s dark');
    next();
  });
};
