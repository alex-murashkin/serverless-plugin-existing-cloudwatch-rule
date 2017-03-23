'use strict';

module.exports = class ExistingEventRulePlugin {
   constructor(serverless) {
      this.hooks = {
         'deploy:compileEvents': () => {
           Object.keys(serverless.service.functions).forEach(functionName => {
             const lambdaFunction = serverless.service.functions[functionName];
             lambdaFunction.events.forEach(event => {
               if (event.cloudWatchRule) {
                 const permission = this._makeEventPermission(functionName, event.cloudWatchRule);
                 serverless.service.provider.compiledCloudFormationTemplate.Resources[permission.name] = permission.definition;
                 serverless.cli.log(`Added permission for existing event rule "${event.cloudWatchRule}" to invoke "${functionName}"`);
               }
             });
           });
         }
      };
   }

   _normalizeName(s) {
     return (s[0].toUpperCase() + s.substr(1)).replace(/[-]/g, 'Dash').replace(/[_]/g, 'Underscore');
     // as per https://serverless.com/framework/docs/providers/aws/guide/resources/
   }

   _makeEventPermission(functionName, eventRuleName) {
      const normalizedFunctionName = this._normalizeName(functionName);
      const source = eventRuleName === 'ANY' ? '*' : eventRuleName;
      return {
        name: `${normalizedFunctionName}LambdaPermission${this._normalizeName(eventRuleName)}`,
        definition: {
           Type: 'AWS::Lambda::Permission',
           Properties: {
              FunctionName: { 'Fn::GetAtt': [ `${normalizedFunctionName}LambdaFunction`, 'Arn' ] },
              Action: 'lambda:InvokeFunction',
              Principal: 'events.amazonaws.com',
              SourceArn: { 'Fn::Join': [ ':', [ 'arn:aws:events', { 'Ref': 'AWS::Region' }, { 'Ref': 'AWS::AccountId' }, source ] ] }
           },
        }
      }
   }
};
