module.exports = {
  development: {
    username: process.env.MYSQL_USER ? process.env.MYSQL_USER : 'root',
    password: process.env.MYSQL_PASSWORD ? process.env.MYSQL_PASSWORD : '123321Qwe',
    database: process.env.MYSQL_DATABASE ? process.env.MYSQL_DATABASE : 'glo_net',
    host: process.env.MYSQL_HOST ? process.env.MYSQL_HOST : 'localhost',
    dialect: 'mysql',
    dialectOptions: {
      connectTimeout: 60000,
    },
    pool: {
      handleDisconnects: true,
      max: 25,
      min: 1,
      idle: 10000,
      acquire: 50000,
    },
    operatorsAliases: false,
    port: process.env.MYSQL_PORT ? process.env.MYSQL_PORT : 3306,
    logging: true,
    define: {
      freezeTableName: true,
      timestamps: false,
      underscored: true,
    },
  },
  test: {
    username: process.env.MYSQL_USER ? process.env.MYSQL_USER : 'root',
    password: process.env.MYSQL_PASSWORD ? process.env.MYSQL_PASSWORD : '123321Qwe',
    database: process.env.MYSQL_DATABASE ? process.env.MYSQL_DATABASE : 'glo_net',
    host: process.env.MYSQL_HOST ? process.env.MYSQL_HOST : 'localhost',
    dialect: 'mysql',
    pool: {
      handleDisconnects: true,
      max: 13,
      min: 1,
      idle: 10000,
      acquire: 50000,
    },
    operatorsAliases: false,
    port: process.env.MYSQL_PORT ? process.env.MYSQL_PORT : 3306,
    logging: false,
    define: {
      freezeTableName: true,
      timestamps: false,
      underscored: true,
    },
  },
  production: {
    username: process.env.MYSQL_USER ? process.env.MYSQL_USER : 'root',
    password: process.env.MYSQL_PASSWORD ? process.env.MYSQL_PASSWORD : '123321Qwe',
    database: process.env.MYSQL_DATABASE ? process.env.MYSQL_DATABASE : 'glo_net',
    host: process.env.MYSQL_HOST ? process.env.MYSQL_HOST : 'localhost',
    dialect: 'mysql',
    pool: {
      handleDisconnects: true,
      max: 13,
      min: 1,
      idle: 10000,
      acquire: 50000,
    },
    operatorsAliases: false,
    port: process.env.MYSQL_PORT ? process.env.MYSQL_PORT : 3306,
    logging: false,
    define: {
      freezeTableName: true,
      timestamps: false,
      underscored: true,
    },
  },
}
