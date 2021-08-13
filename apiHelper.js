const fetch = require("node-fetch");

module.exports = {
  /*
   ** This method returns a promise
   ** which gets resolved or rejected based
   ** on the result from the API
   */
  get: async function (url) {
    const result = await fetch(url);

    const data = await result.json();

    return data;
  },
};
