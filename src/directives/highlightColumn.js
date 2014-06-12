(function(angular) {

    'use strict';

    var tables = angular.module('table.highlightColumn', ['net.enzey.service.css.editor']);

    tables.directive('stgTableHighlightColumn', function(nzCssRuleEditor, stgTableService) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var tableId = stgTableService.getIdOfContainingTable(element);
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