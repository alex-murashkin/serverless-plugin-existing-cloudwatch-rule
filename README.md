# serverless-plugin-existing-cloudwatch-rule

[![npm version](https://badge.fury.io/js/serverless-plugin-existing-cloudwatch-rule.svg)](https://badge.fury.io/js/serverless-plugin-existing-cloudwatch-rule)
[![CircleCI](https://circleci.com/gh/AlexanderMS/serverless-plugin-existing-cloudwatch-rule.svg?style=shield)](https://circleci.com/gh/AlexanderMS/serverless-plugin-existing-cloudwatch-rule)
[![Coverage Status](https://coveralls.io/repos/github/AlexanderMS/serverless-plugin-existing-cloudwatch-rule/badge.svg?branch=master)](https://coveralls.io/github/AlexanderMS/serverless-plugin-existing-cloudwatch-rule?branch=master)

Allows an [AWS Lambda](https://aws.amazon.com/lambda/) function to be triggered
by pre-configured CloudWatch event rules.

In contrast to the traditional
[schedule](https://serverless.com/framework/docs/providers/aws/events/schedule/)
event that creates a new CloudWatch rule, the plugin assumes that an existing
rule is already in place, and the Lambda function is specified as one of
its targets.
The plugin just adds necessary permissions to the Lambda function itself to
complete the "link" between CloudWatch and Lambda.

Useful for projects that setup and scale infrastructure separately from code,
e.g., deploy a Lambda function triggered by multiple timers or s3 events that
are configured by scripts like Terraform, a separate CloudFormation template,
or even a manually created infrastructure.

Also, can be useful for subscribing to an external (cross-account) rule.

Example `serverless.yml`:

```yaml
plugins:
  - serverless-plugin-existing-cloudwatch-rule

functions:
  key-rotation-lambda: #1
    handler: src/key-rotation-lambda.handler
    events:
      - cloudWatchRule: 'rule/key-rotation-timer'
  counter-lambda: #2
    handler: src/counter-lambda.handler
    events:
      - cloudWatchRuleArn: 'arn:aws:events:us-east-1:160879880353:rule/my-project-MidnightSchedule-42UGHOTBBVIET'
  scalable-lambda: #3
    handler: src/scalable-lambda.handler
    events:
      - cloudWatchRule: ANY
```

1. In the example, `key-rotation-timer` is assumed to be setup and pointing
to `key-rotation-lambda`.
The function `key-rotation-lambda` will be deployed on `serverless deploy`
and, due to the plugin, with the necessary permissions to be invoked by
`key-rotation-timer`.
The timer will be shown on the AWS Lambda -> Triggers page as if it was setup
manually or using the traditional `schedule` event.

2. To attach a rule defined by its full ARN, use the `cloudWatchRuleArn`
property, such as in the `counter-lambda` example.

3. The `ANY` keyword allow for any trigger under the current AWS account,
so `serverless` does not need to run on every change to the project's
infrastructure.
In the example, a new timer can be added that triggers `scalable-lambda`
with a different set of arguments, but developers do not need to run
`serverless deploy` or use CLI to change the permissions on the function.
