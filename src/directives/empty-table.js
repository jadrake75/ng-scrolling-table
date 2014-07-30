(function(angular, $, RepeaterUtilities) {

    'use strict';

    var module = angular.module('table.empty-table', []);
    module.directive('tableEmptyMessage', function($timeout, $log) {
       
        return {
            link: function(scope, el, attrs) {
                var msg = (attrs.tableEmptyMessage !== '') ? attrs.tableEmptyMessage : 'No items.';
                var tr = $('<tr class="empty-msg"></tr>');
                var emptyToggleFn = function(val) {
                    if (!val || val.length === 0) {
                        tr.show();
                    } else {
                        tr.hide();
                    }
                };
                $timeout(function() {
                    var modelData = RepeaterUtilities.extractCollection(el);                   
                    if( modelData === undefined ) {
                        $log.warn("no model data found.");
                    }
                    var tbody = el.find("tbody");
                    var rowCount = tbody.find("tr").length;
                    tr.append('<div>' + msg + '</div>');
                    tbody.append(tr);
                    if( rowCount > 0) {
                        tr.hide();
                    }
                    if( modelData ) {
                        scope.$watchCollection(modelData, emptyToggleFn);
                    }
                },0, false);
            }
        };
    });
})(angular, jQuery, RepeaterUtilities);