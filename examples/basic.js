
(function(angular) {
    'use strict';

    angular.module('examples', ['ng-scrolling-table.mixins', 'ng-scrolling-table'])
            .controller('BasicCtrl', function($scope, $compile, $timeout, $rootScope, TableEvents,
                    ScrollingTableHelper, ColumnVisibilityService) {

                $scope.currentSelection = [];
                $scope.hideColumns = false;
                $scope.data = [
                    {'name': 'Jason', 'phoneNumber': '763-555-5522'},
                    {'name': 'Joseph', 'phoneNumber': '651-443-3322'}

                ];
                $timeout(function() {
                    for (var i = 0; i < 2000; i++) {
                        $scope.data.push({'name': 'Person-' + i, 'phoneNumber': '553-223-2378'});
                    }
                }, 500);


                $scope.$on(TableEvents.selection, function(evt, sRows) {
                    $scope.currentSelection = sRows;
                });

                $scope.clearSelection = function(wrapperId) {

                    var tableId = ScrollingTableHelper.getIdOfContainingTable($("#" + wrapperId));
                    $scope.$broadcast(TableEvents.clearSelection, {
                        tabl2eId: tableId
                    });
                };
                $scope.addRow = function() {
                    $scope.data.push({'name': 'Person-' + (new Date()).getTime(), 'phoneNumber': '777-777-7777'});
                };
                $scope.removeRow = function() {
                    $scope.data.splice($scope.data.length - 1, 1);
                };
                $scope.toggleHiddenColumn = function() {
                    $scope.hideColumns = !$scope.hideColumns;
                    var searchTypes = ["col-visibility", "data-col-visibility"];
                    angular.forEach(searchTypes, function(searchType) {
                        var elm = $("th[" + searchType + "]");
                        elm.each(function(indx, el) {
                            var tableId = ScrollingTableHelper.getIdOfContainingTable($(el));
                            ColumnVisibilityService.setColumnVisibility(tableId, el.cellIndex, $scope.hideColumns);
                        });
                    });

                };
            }
            ).config(function($logProvider) {
        $logProvider.debugEnabled(window.location.href.indexOf("debug") > 0);
    });

})(angular);