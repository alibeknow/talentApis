'use strict';

module.exports = {

    IPINFO_TEMPLATE: {
        ip: "",
        is_eu: false,
        city: "",
        region: "",
        region_code: "",
        country_name: "",
        country_code: "",
        continent_name: "",
        continent_code: "",
        latitude: null,
        longitude: null,
        asn: "",
        organisation: "",
        postal: "",
        calling_code: "",
        flag: "",
        emoji_flag: "",
        emoji_unicode: "",
        languages: [],
        currency: {
            name: "",
            code: "",
            symbol: "",
            native: "",
            plural: ""
        },
        time_zone: {
            name: "",
            abbr: "",
            offset: "",
            is_dst: false,
            current_time: ""
        },
        threat: {
            is_tor: false,
            is_proxy: false,
            is_anonymous: false,
            is_known_attacker: false,
            is_known_abuser: false,
            is_threat: false,
            is_bogon: false
        },
        summary: {
            is_threat: false,
            is_proxy: false,
            is_anonymous: false,
            is_known_attacker: false,
            is_known_abuser: false,
            is_bogon: false,
            is_safe: true
        }
    },

    SUBNET_LOG_PERIOD: 1800, // 30 min

    SUBNET_THREAT_COUNT: 45, // events per period

    SUBNET_THREAT_PREFIX: 'snt:',

    API_KEYS: {
        'GeGH8kpKaPSBhsLibiacVDlFx15dAxnQd1': {
            user_id: 100,
            access: true
        }
    }
};
