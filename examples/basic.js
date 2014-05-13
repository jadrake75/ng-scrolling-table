
(function(angular) {
     'use strict';
     
    angular.module('examples', ['ng-scrolling-table'] )
    .controller('BasicCtrl', function($scope) {
        $scope.data = [
    { 'name': 'Jason', 'phoneNumber': '763-555-5522' },
    { 'name': 'Joseph', 'phoneNumber': '651-443-3322' }
    
        ];
        
        for(var i = 0; i < 3000; i++ ) {
            $scope.data.push( { 'name' : 'Person-' + i, 'phoneNumber': '553-223-2378' });
        }
    });
    
})(angular);