(function(angular, $, MutationObserver) {

    'use strict';

    var tables = angular.module('table.highlightColumn', ["table.scrolling-table"]);

    tables.directive('colHighlight', function($timeout, $log, ScrollingTableHelper, TableEvents) {

        /**
         * Track new insertions of TRs into the TBODY and specify for the
         * column TDs the listeners to bind.
         * 
         * @param {type} tableId
         * @param {type} index
         * @returns {undefined}
         */
        function handleInsertions(tableId, index) {
            var tds = $("#" + tableId + " tbody td:nth-child(" + (index + 1) + ")");
            addListeners(tds);
        }

        function addListeners(elems) {
            elems.off("mouseenter mouseleave"); // remove all previously added ones
            elems.hover(function() {
                elems.addClass("col-highlight");
            }, function() {
                elems.removeClass("col-highlight");
            });
        }

        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var tagName = element[0].tagName;
                if (tagName !== "COL" && tagName !== "TH") {
                    $log.error("Using col-highlight on an element " + tagName + " is not supported.");
                    return;
                }
                var tableId = ScrollingTableHelper.getIdOfContainingTable(element);
                if (tableId) {
                    var index = element.parent().children().toArray().indexOf(element[0]);
                    if (index !== undefined) {
                        $timeout(function() {
                           handleInsertions(tableId, index);
                        }, 0, false);
                        scope.$on(TableEvents.insertRows, function(len) {
                            handleInsertions(tableId, index);
                        });
                    }
                    scope.$on('$destroy', function() {
                        var tds = $("#" + tableId + " td:nth-child(" + (index + 1) + ")");
                        tds.off("mouseenter mouseleave");
                    });
                }
            }
        };
    });

})(angular, jQuery, MutationObserver);