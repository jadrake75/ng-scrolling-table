(function(angular, $) {
    "use strict";
    var module = angular.module("table.column-fixed", []);
    
    module.directive('colFixed', function() {
        return {
            restrict: 'CA',
            link: function(scope, elm, attr ) {
                if(attr.colFixed === "false") {
                    return;
                }
                var width = elm.width();
                $(elm).css({
                    "min-width": width,
                    "max-width": width
                });
            }
        };
    });
})(angular, jQuery);