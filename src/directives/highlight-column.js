(function(angular, $, MutationObserver) {

    'use strict';

    var tables = angular.module('table.highlightColumn', []);

    tables.directive('stgHighlightColumn', function($timeout, $log, stgTableService) {

        /**
         * Track new insertions of TRs into the TBODY and specify for the
         * column TDs the listeners to bind.
         * 
         * @param {type} tableId
         * @param {type} index
         * @returns {undefined}
         */
        function trackNewInsertions(tableId, index) {
            var lastCount = 0;
            var lastUpdateTime = (new Date()).getTime();
            var checkForInsert = function() {
                var t = (new Date()).getTime();
                // If the last change was detected in the last five seconds, poll every 1250ms
                // If a change occured within the last 10 minutes, poll every 5000ms
                // If it has been more than 10 minutes since the last change poll every twenty seconds
                var updateTime = (t - lastUpdateTime < 5000) ? 1250 : (t - lastUpdateTime < 600000) ? 5000: 20000;
                $timeout(function() {
                    var trs = $("#" + tableId + " tbody tr");
                    if (trs.length > lastCount) {
                        $log.debug("detected the following insertions:" + (trs.length - lastCount));
                        var tds = $("#" + tableId + " tbody td:nth-child(" + (index + 1) + ")");
                        addListeners(tds);
                        lastCount = trs.length;
                        lastUpdateTime = (new Date()).getTime();
                    } else {
                        $log.debug("no insertions detected.  Using poll time:" + updateTime);
                    }
                    checkForInsert();
                }, updateTime, false);
            };
            checkForInsert();
        }

        function addListeners(elems) {
            elems.off("mouseenter mouseleave"); // remove all previously added ones
            elems.hover(function() {
                elems.addClass("column-highlight");
            }, function() {
                elems.removeClass("column-highlight");
            });
        }

        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var tagName = element[0].tagName;
                if (tagName !== "COL" && tagName !== "TH") {
                    $log.error("Using stg-highlight-column on an element " + tagName + " is not supported.");
                    return;
                }
                var tableId = stgTableService.getIdOfContainingTable(element);
                if (tableId) {
                    var index = element.parent().children().toArray().indexOf(element[0]);
                    if (index !== undefined) {
                        $timeout(function() {
                            var tds = $("#" + tableId + " td:nth-child(" + (index + 1) + ")");
                            addListeners(tds);
                            trackNewInsertions(tableId, index);
                        }, 0, false);

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