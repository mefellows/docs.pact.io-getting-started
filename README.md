This getting started guide runs purely in the browser, with the intention to get you across the key concepts quickly.
An example scenario: Order API
Here we have an example describing Pact tests between a consumer (Order Web), and its provider (the Order API).
In the Consumer project, we're going to need:
A model (the Order class) to represent the data returned from the Order API
A client (the OrderApiClient) which will be responsible for making the HTTP calls to the Order API and returning an internal representation of an Order.
Note that to create a pact, you do need to write the code that executes the HTTP requests to your service (in your client class), but you don't need to write the full stack of consumer code (eg. the UI).
Scope of a Consumer Pact Test
Ideally, the Pact tests should be "unit tests" for your client class, and they should just focus on ensuring that the request creation and response handling are correct. If you use pact for your UI tests, you'll end up with an explosion of redundant interactions that will make the verification process tedious. Remember that pact is for testing the contract used for communication, and not for testing particular UI behaviour or business logic.
Usually, your application will be broken down into a number of sub-components, depending on what type of application your consumer is (e.g. a Web application or another API). This is how you might visualise the coverage of a consumer Pact test:

Here, a Collaborator is a component who's job is to communicate with another system. In our case, this is the OrderApiClientcommunicating with the external Order Api system. This is what we want our consumer test to inspect.

In the Order Web (consumer) project

1. Start with your model
   Imagine a model class that looks something like this. The attributes for a Alligator live on a remote server, and will need to be retrieved by an HTTP call to the Animal Service.
   const provider = new Pact({
   consumer: "Matching Service",
   provider: "Animal Profile Service",
   // port: 1234, // You can set the port explicitly here or dynamically (see setup() below)
   log: path.resolve(process.cwd(), "logs", "mockserver-integration.log"),
   dir: path.resolve(process.cwd(), "pacts"),
   logLevel: LOG_LEVEL,
   spec: 2,
   })
   const suitor = {
   id: 2,
   available_from: "2017-12-04T14:47:18.582Z",
   first_name: "Nanny",
   animal: "goat",
   last_name: "Doe",
   age: 27,
   gender: "F",
   location: {
   description: "Werribee Zoo",
   country: "Australia",
   post_code: 3000,
   },
   eligibility: {
   available: true,
   previously_married: true,
   },
   interests: ["walks in the garden/meadow", "parkour"],
   }

2. Create a skeleton Animal Service client class
   Perhaps we have an Animal Service client class that looks something like this (please excuse the use of httparty):
   require 'httparty'

class AnimalServiceClient
include HTTParty
base_uri 'http://animal-service.com'

def get_alligator # Yet to be implemented because we're doing Test First Development...
end
end

3. Configure the mock Animal Service
   The following code will create a mock service on localhost:1234 which will respond to your application's queries over HTTP as if it were the real Animal Service app. It also creates a mock provider object which you will use to set up your expectations. The method name to access the mock service provider will be what ever name you give as the service argument - in this case animal_service.

# In /spec/service_providers/pact_helper.rb

require 'pact/consumer/rspec'

# or require 'pact/consumer/minitest' if you are using Minitest

Pact.service_consumer "Zoo App" do
has_pact_with "Animal Service" do
mock_service :animal_service do
port 1234
end
end
end

4. Write a failing spec for the Animal Service client

# In /spec/service_providers/animal_service_client_spec.rb

# When using RSpec, use the metadata `:pact => true` to include all the pact functionality in your spec.

# When using Minitest, include Pact::Consumer::Minitest in your spec.

describe AnimalServiceClient, :pact => true do

before do # Configure your client to point to the stub service on localhost using the port you have specified
AnimalServiceClient.base_uri 'localhost:1234'
end

subject { AnimalServiceClient.new }

describe "get_alligator" do

    before do
      animal_service.given("an alligator exists").
        upon_receiving("a request for an alligator").
        with(method: :get, path: '/alligator', query: '').
        will_respond_with(
          status: 200,
          headers: {'Content-Type' => 'application/json'},
          body: {name: 'Betty'} )
    end

    it "returns a alligator" do
      expect(subject.get_alligator).to eq(Alligator.new('Betty'))
    end

end

end

5. Run the specs
   Of course, the above specs will fail because the Animal Service client method is not implemented. No pact file has been generated yet because only interactions that were correctly executed will be written to the file, and we don't have any of those yet.
6. Implement the Animal Service client consumer methods
   class AnimalServiceClient
   include HTTParty
   base_uri 'http://animal-service.com'

def get_alligator
name = JSON.parse(self.class.get("/alligator").body)['name']
Alligator.new(name)
end
end

7. Run the specs again.
   Green!
   Running the passing AnimalServiceClient spec will generate a pact file in the configured pact dir (spec/pacts by default). Logs will be output to the configured log dir (log by default) that can be useful when diagnosing problems.
   You now have a pact file that can be used to verify your expectations of the Animal Service provider project.
   Now, rinse and repeat for other likely status codes that may be returned. For example, consider how you want your client to respond to a:
   404 (return null, or raise an error?)
   400 (how should validation errors be handled, what will the body look like when there is one?)
   500 (specifying that the response body should contain an error message, and ensuring that your client logs that error message will make your life much easier when things go wrong. Note that it may be hard to force your provider to generate a 500 error on demand if you are not using Ruby. You may need to collaborate with your provider team to create a known provider state that will artificially return a 500 error, or you may just wish to use a standard unit test without a pact to test this.)
   401/403 if there is authorisation.
   In the Animal Service (provider) project
1. Create the skeleton API classes
   Create your API class using the framework of your choice (the Pact authors have a preference for Webmachine and Roar) - leave the methods unimplemented, we're doing Test First Develoment, remember?
1. Tell your provider that it needs to honour the pact file you made earlier
   Require "pact/tasks" in your Rakefile.

# In Rakefile

require 'pact/tasks'
Create a pact_helper.rb in your service provider project. The recommended place is spec/service_consumers/pact_helper.rb.
For more information, see Verifying Pacts and the provider configuration documentation for your Pact implementation language (if you are following this example, here is the Ruby documentation).

# In specs/service_consumers/pact_helper.rb

require 'pact/provider/rspec'

Pact.service_provider "Animal Service" do

honours_pact_with 'Zoo App' do

    # This example points to a local file, however, on a real project with a continuous
    # integration box, you would use a [Pact Broker](https://github.com/pact-foundation/pact_broker) or publish your pacts as artifacts,
    # and point the pact_uri to the pact published by the last successful build.

    pact_uri '../zoo-app/specs/pacts/zoo_app-animal_service.json'

end
end

3. Run your failing specs
   $ rake pact:verify
Congratulations! You now have a failing spec to develop against.
At this stage, you'll want to be able to run your specs one at a time while you implement each feature. At the bottom of the failed pact:verify output you will see the commands to rerun each failed interaction individually. A command to run just one interaction will look like this:
$ rake pact:verify PACT_DESCRIPTION="a request for an alligator" PACT_PROVIDER_STATE="an alligator exists"
4. Implement enough to make your first interaction spec pass
   Rinse and repeat.
5. Keep going til you're green
   Yay! Your Animal Service provider now honours the pact it has with your Zoo App consumer. You can now have confidence that your consumer and provider will play nicely together.
