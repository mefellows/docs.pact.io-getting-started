// Let's use async/await
const consumerTest = async () => {
  const pact = require("@pact-foundation/pact");
  const { Pact, Matchers } = pact;
  const path = require("path");
  const url = "http://localhost";
  let port;
  const axios = require("axios");
  const chai = require("chai");
  const expect = chai.expect;
  const { pactFile } = require("../setup");

  // Dog Client
  // Will hit a Dog API and retrieve dogs
  const getDogs = endpoint => {
    const url = endpoint.url;
    const port = endpoint.port;

    return axios.request({
      method: "GET",
      baseURL: `${url}:${port}`,
      url: "/dogs",
      headers: { Accept: "application/json" }
    });
  };

  // STEP 1: Write a consumer Tests
  const provider = new Pact({
    port: port,
    log: path.resolve(process.cwd(), "logs", "pact.log"),
    dir: path.resolve(process.cwd(), "pacts"),
    consumer: "DogConsumer",
    provider: "DogProvider"
  });

  // Start mock server (this normally goes in a "beforeAll" block)
  await provider.setup().then(config => {
    port = config.port;
  });

  // Setup interactions for expected API response from provider
  const interaction = {
    state: "i have a list of dogs",
    uponReceiving: "a request for all dogs",
    withRequest: {
      method: "GET",
      path: "/dogs",
      headers: {
        Accept: "application/json"
      }
    },
    willRespondWith: {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: [
        {
          dog: Matchers.somethingLike(1),
          name: Matchers.term({
            matcher: "(\\S+)",
            generate: "rocky"
          })
        }
      ]
    }
  };

  // Setup the test state (e.g. a "before" block)
  await provider.addInteraction(interaction);

  // Perform the test (i.e. the "it")
  const response = await getDogs({
    url: url,
    port: port
  });

  // Assert what we expect
  expect(response.data).to.deep.eql([
    {
      dog: 1,
      name: "rocky"
    }
  ]);

  // verify with Pact, and reset expectations
  // This will throw an Error if the dogClient doesn't do what is expected in the interaction setup
  await provider.verify();

  // Write the pact file for sharing with the provider team
  await provider.finalize();

  console.log("Consumer test passed!");
};

module.exports = {
  consumerTest
};
