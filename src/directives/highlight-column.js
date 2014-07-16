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
            var target = $("#" + tableId + " tbody")[0];
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                        angular.forEach(mutation.addedNodes, function(node) {
                            if (node.tagName === "TR") {
                                var tds = $(node).parent().find("td:nth-child(" + (index+1) + ")");
                                addListeners(tds);
                            }
                        });
                    }
                });
            });
            var config = {childList: true};
            observer.observe(target, config);
            return observer;
        };

        function addListeners(tds) {
            tds.off("mouseenter mouseleave"); // remove all previously added ones
            tds.hover(function() {
                tds.addClass("column-highlight");
            }, function() {
                tds.removeClass("column-highlight");
            });
            //TODO: possible memory leak from not clearing on $destroy?
        };

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
                    var observer = null;
                    var index = element.parent().children().toArray().indexOf(element[0]);
                    if (index !== undefined) {
                        observer = trackNewInsertions(tableId, index);
                    }
                    scope.$on('$destroy', function() {
                        if (observer !== null) {
                            observer.disconnect(); // remove observer from binding
                        }
                    });
                }
            }
        };
    });

})(angular, jQuery, MutationObserver);