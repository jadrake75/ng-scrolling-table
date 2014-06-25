(function(angular) {

    'use strict';

    var tables = angular.module('table.highlightColumn', ['net.enzey.service.css.editor']);

    tables.directive('stgTableHighlightColumn', function(nzCssRuleEditor) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var tableId = scope.tableUUID;
                if (tableId) {
                    var index = element.parent().children().toArray().indexOf(element[0]);
                    var columnRule = nzCssRuleEditor.getCustomRule('#' + tableId + ' .scroller td:nth-child(' + (index+1) + ')');
                    $(element).mouseover(function() {
                        columnRule.backgroundColor = 'lightblue';
                    });
                    $(element).mouseout(function() {
                        columnRule.backgroundColor = '';
                    });
                }
            }
        };
    });

})(angular);