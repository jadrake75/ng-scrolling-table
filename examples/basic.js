
(function(angular) {
     'use strict';
     
    angular.module('examples', ['ng-scrolling-table.mixins', 'ng-scrolling-table'] )
    .controller('BasicCtrl', function($scope, $timeout, stgControllerEvents) {
        
        $scope.currentSelection = [];
        $scope.data = [
    { 'name': 'Jason', 'phoneNumber': '763-555-5522' },
    { 'name': 'Joseph', 'phoneNumber': '651-443-3322' }
    
        ];
        $timeout(function() {
             for(var i = 0; i < 3000; i++ ) {
            $scope.data.push( { 'name' : 'Person-' + i, 'phoneNumber': '553-223-2378' });
        }
        }, 500);
       
        
        $scope.$on(stgControllerEvents.selection, function(evt, sRows) {
            $scope.currentSelection = sRows;
        });
        
        $scope.addRow = function() {
            $scope.data.push( { 'name' : 'Person-' + (new Date()).getTime(), 'phoneNumber': '777-777-7777' });
        };
        
    }).config(function($logProvider) {
      $logProvider.debugEnabled( window.location.href.indexOf("debug") > 0 );
    });
    
})(angular);