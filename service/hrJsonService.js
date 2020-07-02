const axios = require('axios');
const config = require('../config/common');

module.exports.getHrJson = async function getHrJson(base64) {
    return axios.post(config.RESUME_PARSER_URL, base64, {
        headers: {
            'Content-Type': 'text/plain'
        }
    }).then(value => {
        if (value.status === 200) {
            console.log('1 raw candidate has been converted to hr json');
            return value.data.result.hr_json;
        }
        return null;
    }).catch(reason => {
        console.log(reason);
        return null;
    });
};
