(function(angular) {

    'use strict';

    var UUID = 0;
    var getUUID = function() {
        return 'scrollingTable-' + UUID++;
    };

    var tables = angular.module('table.scrolling-table', ['net.enzey.service.css.editor']);

    tables.service('tableService', function() {
        return {
            getIdOfContainingTable: function(element) {
                var tableContainer = element.closest('.tableWrapper');
                if (tableContainer && tableContainer[0]) {
                    return tableContainer[0].id;
                }

                // The element with the directive was passed.
                tableContainer = element.find('.tableWrapper');
                if (tableContainer && tableContainer.length === 1) {
                    return tableContainer[0].id;
                }
            }
        }
    });

    tables.directive('scrollingTable', function($timeout, $window, nzCssRuleEditor, tableService) {
        var linker = function(scope, element, attrs) {
            var modelData = (attrs.data) ? attrs.data : 'data';

            var debounceId;
            var recalcFn = function() {
                $timeout.cancel(debounceId);
                debounceId = $timeout(function() {
                    calculateDimensions(element);
                }, 25, false);
            };
            $($window).resize(function() {
                recalcFn();
            });
            scope.$watch(modelData, function() {
                recalcFn();
            });

            var cloneHead = $(element.find('thead')[0]).clone();
            element.append(cloneHead.removeClass('tableHeader').addClass('minWidthHeaders'));

            $timeout(function() {
                var scroller = element.find('div.scroller');
                element.find('.tableHeader table').width("calc(100% - " + (scroller.width() - scroller.find('table').width()) + "px)");

                var tableUUID = tableService.getIdOfContainingTable(element);

                var allMinWidthHeaders = cloneHead.find('th');
                for (var i=0; i < allMinWidthHeaders.length; i++) {
                    var columnRule = nzCssRuleEditor.getRule('#' + tableUUID + ' .tableHeader th:nth-child(' + (i+1) + ')');
                    columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';
                    /* Causes longer table rendering times
                    var columnRule = nzCssRuleEditor.getRule('#' + tableUUID + ' .scroller td:nth-child(' + (i+1) + ')');
                    columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';
                    */
                }
                cloneHead.remove();
            }, 0, false);
        };

        function calculateDimensions(wrapDiv) {
            var header = wrapDiv.find('thead');
            var body = wrapDiv.find("tbody");
            var h = header.find('tr').height();
            h = (h > 0) ? h : 25;
            calculateWidths(wrapDiv);
        }

        function calculateWidths(table) {
            var allBodyCols = table.find('tbody tr:first td');
            if (allBodyCols.length > 0) {
                table.find('.tableHeader th').each(function(index) {
                    var padding = 0;
                    var desiredWidth = $(allBodyCols[index]).width();
                    $(this).css('width', desiredWidth);
                });
            }
        }

        return {
            restrict: 'A',
            compile: function compile($element, attrs, transclude) {
                var tableUUID = getUUID();

                var wrapper = $('<div class="tableWrapper"></div>');
                wrapper.attr('id', tableUUID);

                var headWrap = $('<div class="tableHeader"><table></table></div>');
                var headTable = $(headWrap.find('table')[0]);
                var bodyWrap = $('<div class="scroller"><table></table></div>');
                wrapper.append(headWrap).append(bodyWrap);

                headTable.append(wrapper.find('thead'));

                var headerTable = $(headWrap.find('table')[0]);
                var dataTable =  $(bodyWrap.find('table')[0]);
                $element.find('thead').each(function(index, elem) {
                    headerTable.append(elem);
                });
                $element.find('tbody').each(function(index, elem) {
                    dataTable.append(elem);
                });

                var maxHeight = $element.css('max-height');
                if( (!maxHeight || maxHeight === 'none') && attrs.height ) {
                    maxHeight = attrs.height + 'px';
                }
                wrapper.find('.scroller').css('max-height', maxHeight);
                $element.css('max-height', 0);

                $element.after(wrapper);
                $element.remove();

                return {
                    // Is run BEFORE child directives.
                    pre: linker
                }
            }
        };
    });

})(angular);