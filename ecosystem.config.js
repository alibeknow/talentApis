module.exports = {
    apps: [{
        "name": "glotalentapi",
        "script": "./index.js",
        "instances": "max",
        "exec_mode": "cluster"
    }]
};
