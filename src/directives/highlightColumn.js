(function(angular) {

    'use strict';

    var tables = angular.module('table.highlightColumn', []);

    tables.directive('tableHighlightColumn', function(nzCssRuleEditor, tableService) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var tableId = tableService.getIdOfContainingTable(element);
                if (tableId) {
                    var index = element.parent().children().toArray().indexOf(element[0]);
                    var columnRule = nzCssRuleEditor.getRule('#' + tableId + ' .scroller td:nth-child(' + (index+1) + ')');
                    $(element).mouseover(function() {
                        columnRule.backgroundColor = 'lightblue';
                    });
                    $(element).mouseout(function() {
                        columnRule.backgroundColor = null;
                    });
                }
            }
        };
    });

})(angular);