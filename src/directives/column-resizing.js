(function(angular, $, Math) {
    'use strict';

    var module = angular.module("table.column-resizing", ["table.scrolling-table"]);

    /**
     * Support the ability to resize columns on the table.  Placing this directive
     * on a TABLE element will enable all columns to be resizable except for the
     * last column on the right.  As well any column that declares the column-fixed="true"
     * attribute will be excluded from resizing.
     *
     * @param {constant} TableAttributes Constants for the fixed column attributes
     */
    module.directive("tableColumnsResizable", function($timeout, TableAttributes, nzEventHelper) {
        return {
            controller: function($scope, $element) {

                var tableColElems = [];
                if ($element) {
                    if ($element[0].tagName === 'TABLE') {
                        var tableCols = [];
                        tableColElems.push(tableCols);
                        var cols = $element[0].querySelectorAll('col');
                        for (var i = 0; i < cols.length; i++) {
                            tableCols.push(cols[i]);
                        }
                    } else {
                        var tables = $element[0].querySelectorAll('table');
                        for (var tableIndex = 0; tableIndex < tables.length; tableIndex++) {
                            var tableCols = [];
                            tableColElems.push(tableCols);
                            var cols = tables[tableIndex].querySelectorAll('col');
                            for (var i = 0; i < cols.length; i++) {
                                tableCols.push(cols[i]);
                            }
                        }
                    }
                }

                this.setColumnWidth = function (columnIndex, width) {
                    if (columnIndex === null) {return};
                    columnIndex = +columnIndex;
                    if (columnIndex >= 0) {
                        tableColElems.forEach(function (tableColumns) {
                            var colElem = tableColumns[columnIndex];
                            if (colElem) {
                                colElem.style.width = width;
                            }
                        });
                    }
                };

                return this;
            },
            compile: function($element, $attrs) {

                var headers = $element[0].querySelectorAll('thead tr th');

                var headerCount = headers.length;
                while (headerCount--) {
                    headers[headerCount].setAttribute('resizable-column', '');
                }

                return function(scope, el, attrs) {

                }
            }
        };
    });

    module.directive("resizableColumn", function($window, nzEventHelper) {
        return {
            require: '^tableColumnsResizable',
            compile: function($element, $attrs) {
                if  ($attrs.colFixed === 'true') {return;}

                var resizeGripper = angular.element('<div class="resizeGripper"></div>')[0];
                $element[0].appendChild(resizeGripper);

                // Get Index of current header
                var thIndex;
                var allHeaders = $element[0].parentElement.querySelectorAll('TH');
                for (var i = 0; i < allHeaders.length; i++) {
                    if ($element[0] === allHeaders[i]) {
                        thIndex = i;
                        break;
                    }
                }

                return function(scope, element, attrs, tableColumnsResizableCtrl) {

                    var thComputedStyle;
                    var originalColumnWidth;
                    var originalCursor;
                    nzEventHelper.registerMouseDragHandler($(resizeGripper),
                        // Mouse Down
                        function(mouseDownEvent) {
                            originalColumnWidth = element[0].getBoundingClientRect().width;
                            thComputedStyle = $window.getComputedStyle(element[0]);
                            originalCursor = $window.document.body.style.cursor;
                            $window.document.body.style.cursor = $window.getComputedStyle(resizeGripper).cursor;
                        },
                        // Mouse Move
                        function(xDelta, yDelta, mouseDownEvent, mouseMoveEvent) {
                            var newWidth = originalColumnWidth + xDelta;
                            var maxWidth = parseInt(thComputedStyle.getPropertyValue('max-width'));
                            var minWidth = parseInt(thComputedStyle.getPropertyValue('min-width'));

                            newWidth = Math.min(newWidth, maxWidth ? maxWidth : Infinity);
                            newWidth = Math.max(newWidth, minWidth ? minWidth : 0);
                            tableColumnsResizableCtrl.setColumnWidth(thIndex, newWidth + 'px');
                        },
                        // Mouse Up
                        function(mouseUpEvent) {
                            $window.document.body.style.cursor = originalCursor;
                        },
                        0
                    );

                }
            }
        };
    });

})(angular, jQuery, Math);