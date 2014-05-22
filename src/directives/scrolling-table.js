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

    tables.directive('tableRow', function($compile) {
        return {
            restrict: 'A',
            priority: 99,
            compile: function($element, attrs, transclude) {
                return {
                    pre: function(scope, element, attrs) {
                        element.after($compile( scope[attrs.tableRow].join('') )(scope));
                        element.remove();
                    }
                }
            },
        }
    });

    tables.directive('scrollingTable', function($timeout, $window, $compile, nzCssRuleEditor, tableService) {
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
            scope: true,
            compile: function compile($element, attrs, transclude) {
                var tableUUID = getUUID();

                var wrapper = $('<div class="tableWrapper"></div>');
                wrapper.attr('id', tableUUID);

                var headWrap = $('<div class="tableHeader"><table></table></div>');
                var bodyWrap = $('<div class="scroller"><table></table></div>');
                wrapper.append(headWrap).append(bodyWrap);

                var headerTable = $(headWrap.find('table')[0]);
                var dataTable =  $(bodyWrap.find('table')[0]);
                $element.find('thead').each(function(index, elem) {
                    $(elem).detach().appendTo(headerTable);
                });
                $element.find('tbody').each(function(index, elem) {
                    $(elem).detach().appendTo(dataTable);
                });

                var maxHeight = $element.css('max-height');
                if( (!maxHeight || maxHeight === 'none') && attrs.height ) {
                    maxHeight = attrs.height + 'px';
                }
                wrapper.find('.scroller').css('max-height', maxHeight);
                $element.css('max-height', 0);

                $element.after(wrapper);
                $element.remove();

                // Regex strips illegal markup from element
                //   which causes render failures in IE
                var regexOnlyTagData = '<.*>';
                var headerRows = wrapper.find('thead tr');
                var headersElemArray = [];
                headerRows.children().each(function(index, wrapper) {
                    headersElemArray.push(wrapper.outerHTML.match(regexOnlyTagData)[0]);
                });
                $(headerRows[0]).empty();
                $(headerRows[0]).append('<td table-row="headersElemArray"></td>');

                var bodyRows = wrapper.find('tbody tr');
                var bodyElemArray = [];
                bodyRows.children().each(function(index, wrapper) {
                    bodyElemArray.push(wrapper.outerHTML.match(regexOnlyTagData)[0]);
                });
                $(bodyRows[0]).empty();
                $(bodyRows[0]).append('<td table-row="bodyElemArray"></td>');

                return {
                    // Is run BEFORE child directives.
                    pre: function(scope, element, attrs) {
                        var modelData = (attrs.data) ? attrs.data : 'data';
                        scope.headersElemArray = headersElemArray;
                        scope.bodyElemArray = bodyElemArray;

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

                    },
                    post: function(scope, element, attrs) {
                        var cloneHead = $(element.find('thead')[0]).clone();
                        var allMinWidthHeaders = cloneHead.find('th');
                        element.append(cloneHead.removeClass('tableHeader').addClass('minWidthHeaders'));

                            var tableUUID = tableService.getIdOfContainingTable(element);

                            for (var i=0; i < allMinWidthHeaders.length; i++) {
                                var columnRule = nzCssRuleEditor.getRule('#' + tableUUID + ' .tableHeader th:nth-child(' + (i+1) + ')');
                                columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';
                                var columnRule = nzCssRuleEditor.getRule('#' + tableUUID + ' .scroller td:nth-child(' + (i+1) + ')');
                                columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';
                            }
                            cloneHead.remove();

                        $timeout(function() {
                            var scroller = element.find('div.scroller');
                            element.find('.tableHeader table').width("calc(100% - " + (scroller.width() - scroller.find('table').width()) + "px)");
                        }, 0, false);
                    }
                }
            }
        };
    });

})(angular);