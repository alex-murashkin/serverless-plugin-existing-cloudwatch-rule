# serverless-plugin-existing-cloudwatch-rule

Allows a Lambda function to be triggered by pre-configured CloudWatch event rules. 

In contrast to the traditional `s3` and `schedule` events that physcially create new events and rules, the plugin assumes those events and rules are already in place and specify the Lambda function as one of the targets. The plugin just adds necessary permissions to the Lambda function itself to complete the "link" between CloudWatch and Lambda.

Useful for projects that setup and scale infrastructure separately from code, e.g., deploy a Lambda function triggered by multiple timers or s3 events that are configured by a separate CloudFormation template, or scripts like Terraform, or even manually created infrastructure.

Example `serverless.yml`:

```yml
plugins:
  - serverless-plugin-existing-cloudwatch-rule

functions:
  key-rotation-lambda:
    handler: src/key-rotation-lambda.handler
    events:
      - cloudWatchRule: key-rotation-timer
  scalable-lambda:
    handler: src/scalable-lambda.handler
    events:
      - cloudWatchRule: ANY
```

In the example, `key-rotation-timer` is assumed to be created and pointing to `key-rotation-lambda`, and the lambda function `key-rotation-lambda` will be deployed on `serverless deploy` and (due to the plugin) with the necessary permissions. The timer will be shown on the AWS Lambda -> Triggers page as if it was setup manually or using the traditional `schedule` event. 

The `ANY` keyword allow for any trigger under the current AWS account, so `serverless` does not need to run on every change to the project's infrastructure. In the example, a new timer can be added that triggers `scalable-lambda` with a different set of arguments, but developers do not need to run `serverless deploy` or use CLI to change the permissions on the function.
