'use strict';

module.exports = class ExistingEventRulePlugin {
   constructor(serverless) {
      this.hooks = {
         'deploy:compileEvents': () => {
           Object.keys(serverless.service.functions).forEach(functionName => {
             const lambdaFunction = serverless.service.functions[functionName];
             lambdaFunction.events.forEach(event => {
               if (event.cloudWatchRule || event.cloudWatchRuleArn) {
                 const rule = event.cloudWatchRule || event.cloudWatchRuleArn;
                 const permission = this._makeEventPermission(functionName, rule);
                 serverless.service.provider.compiledCloudFormationTemplate.Resources[permission.name] = permission.definition;
                 serverless.cli.log(`Added permission for existing event rule "${rule}" to invoke "${functionName}"`);
               }
             });
           });
         }
      };
   }

   _normalizeName(s) {
     return (s[0].toUpperCase() + s.substr(1)).replace(/[-]/g, 'Dash').replace(/[_]/g, 'Underscore').replace(/[\/]/g, '');
     // as per https://serverless.com/framework/docs/providers/aws/guide/resources/
   }

   _buildPermissionSourceArn(rule) {
     if (rule.startsWith('arn')) { return rule; }
     const source = rule === 'ANY' ? '*' : rule;
     return { 'Fn::Join': [ ':', [ 'arn:aws:events', { 'Ref': 'AWS::Region' }, { 'Ref': 'AWS::AccountId' }, source ] ] };
   }

   _makeEventPermission(functionName, ruleIdentifier) {
      const normalizedFunctionName = this._normalizeName(functionName);
      const eventRuleName = (() => {
        const parts = ruleIdentifier.split(':');
        return parts[parts.length-1];
      })();
      const sourceArn = this._buildPermissionSourceArn(ruleIdentifier);

      return {
        name: `${normalizedFunctionName}LambdaPermission${this._normalizeName(eventRuleName)}`,
        definition: {
           Type: 'AWS::Lambda::Permission',
           Properties: {
              FunctionName: { 'Fn::GetAtt': [ `${normalizedFunctionName}LambdaFunction`, 'Arn' ] },
              Action: 'lambda:InvokeFunction',
              Principal: 'events.amazonaws.com',
              SourceArn: sourceArn
           },
        }
      }
   }
};
