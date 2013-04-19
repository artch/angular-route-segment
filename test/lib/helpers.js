beforeEach(function() {
    this.addMatchers({
        toHaveClass : function(cls) {
            var notText = this.isNot ? " not" : "";
            this.message = function() {
                return "Expected '" + angular.mock.dump(this.actual) + "'" +
                        notText + " to have class '" + cls + "'.";
            };

            return this.actual.hasClass(cls);
        },
        
        toBeVisible : function() {
            var notText = this.isNot ? " not" : "";
            this.message = function() {
                return "Expected '" + angular.mock.dump(this.actual) + "'" +
                        notText + " to be visible.";
            };

            return this.actual.css('display') != 'none';
        },
        
        toHaveBeenCalledWithContain : function(obj) {

            if (!jasmine.isSpy(this.actual)) {
                throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
            } 
            
            this.message = function() {
                var invertedMessage = "Expected spy " + this.actual.identity + " not to have been called with contain " + jasmine.pp(obj) + " but it was.";
                var positiveMessage = "";
                if (this.actual.callCount === 0) {
                  positiveMessage = "Expected spy " + this.actual.identity + " to have been called with contain " + jasmine.pp(obj) + " but it was never called.";
                } else {
                  positiveMessage = "Expected spy " + this.actual.identity + " to have been called with contain " + jasmine.pp(obj) + " but actual calls were " + jasmine.pp(this.actual.argsForCall).replace(/^\[ | \]$/g, '');
                }
                return [positiveMessage, invertedMessage];
            };
            
            if(!this.actual.wasCalled)
                return false;
              
            var result = true;
            for(var key in obj) {
                result = result && this.env.equals_(this.actual.argsForCall[0][0][key], obj[key]);
            }
            
            return result;
        }
    });
});