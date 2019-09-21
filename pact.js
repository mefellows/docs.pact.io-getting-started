const provider = new Pact({
  port: port,
  log: path.resolve(process.cwd(), "logs", "pact.log"),
  dir: path.resolve(process.cwd(), "pacts"),
  consumer: "OrderWeb",
  provider: "OrderApi"
});

module.exports = {
  provider
};
