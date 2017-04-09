'use strict';

const
  sinon = require('sinon'),
  assert = require('chai').assert,
  Plugin = require('../index');

function runPlugin(functions, logSpy) {
  const serverlessInstance = {
    service: {
      functions,
      provider: {
        compiledCloudFormationTemplate: {
          Resources: {}
        }
      }
    },
    cli: {
      log: logSpy
    }
  };

  const plugin = new Plugin(serverlessInstance);
  plugin.hooks['deploy:compileEvents'].call(plugin);
  return serverlessInstance;
}

describe('serverless-plugin-existing-cloudwatch-rule', function() {
  let sandbox, logSpy;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    logSpy = sandbox.spy();
  });

  afterEach(function() {
    sandbox.verifyAndRestore();
  });

  it('creates template for named rule', function() {
    const result = runPlugin({
      namedFunction: {
        events: [
          {
            cloudWatchRule: 'externalTimer'
          }
        ]
      }
    }, logSpy);

    assert.deepEqual(
      result.service.provider.compiledCloudFormationTemplate.Resources,
      require('./json/rule-named.json')
    );

    assert.equal(logSpy.getCall(0).args[0], 'Added permission for existing event rule "externalTimer" to invoke "namedFunction"');
  });

  it('creates template for named rule prefixed with "rule/"', function() {
    const result = runPlugin({
      namedFunction: {
        events: [
          {
            cloudWatchRule: 'rule/externalTimer'
          }
        ]
      }
    }, logSpy);

    assert.deepEqual(
      result.service.provider.compiledCloudFormationTemplate.Resources,
      require('./json/rule-named-prefixed.json')
    );

    assert.equal(logSpy.getCall(0).args[0], 'Added permission for existing event rule "rule/externalTimer" to invoke "namedFunction"');
  });

  it('creates template for rule defined by full ARN', function() {
    const result = runPlugin({
      namedFunction: {
        events: [
          {
            cloudWatchRuleArn: 'arn:aws:events:us-east-1:160879880353:rule/my_project-PDTMidnightSchedule-42UGHOTBBVIET'
          }
        ]
      }
    }, logSpy);

    assert.deepEqual(
      result.service.provider.compiledCloudFormationTemplate.Resources,
      require('./json/rule-full-arn.json')
    );

    assert.equal(logSpy.getCall(0).args[0], 'Added permission for existing event rule "arn:aws:events:us-east-1:160879880353:rule/my_project-PDTMidnightSchedule-42UGHOTBBVIET" to invoke "namedFunction"');
  });

  it('creates template for ANY rule', function() {
    const result = runPlugin({
      namedFunction: {
        events: [
          {
            cloudWatchRule: 'ANY'
          }
        ]
      }
    }, logSpy);

    assert.deepEqual(
      result.service.provider.compiledCloudFormationTemplate.Resources,
      require('./json/rule-any.json')
    );

    assert.equal(logSpy.getCall(0).args[0], 'Added permission for existing event rule "ANY" to invoke "namedFunction"');
  });

  it('creates nothing when not specified', function() {
    const result = runPlugin({
      namedFunction: {
        events: [
          {
            s3: 'does not matter'
          }
        ]
      }
    }, logSpy);

    assert.deepEqual(
      result.service.provider.compiledCloudFormationTemplate.Resources,
      {}
    );

    assert.isOk(logSpy.callCount === 0);
  });
});
