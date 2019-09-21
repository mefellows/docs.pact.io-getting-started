// Let's use async/await
(async () => {
  const { consumerTest } = require("./consumer/consumer.spec");
  const { publishPacts } = require("./publish");
  const { providerTest } = require("./provider/provider.spec");

  await consumerTest();
  // await publishPacts()
  // await providerTest()
})();
