'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/common');
const configSecurity = require('../config/security');

module.exports = {
    verifyToken: function verifyToken(req, secDef, token, next) {
        const bearerRegex = /^Bearer\s/;

        if (token && bearerRegex.test(token)) {
            let newToken = token.replace(bearerRegex, '');
            jwt.verify(newToken, 'secretKey',
                {
                    issuer: 'ISA Auth'
                },
                (error, decoded) => {
                    if (error === null && decoded) {
                        return next();
                    }
                    return next(req.res.sendStatus(403));
                }
            );
        } else {
            return next(req.res.sendStatus(403));
        }
    },

    verifyAPIKey: function verifyAPIKey(req, secDef, token, next) {

        if (token.api_key) {
            if (configSecurity.API_KEYS[token.api_key]) {
                req.userData = configSecurity.API_KEYS[token.api_key];
                return next();
            } else {
                return next(req.res.sendStatus(403));
            }
        } else {
            return next(req.res.sendStatus(403));
        }
    }

};