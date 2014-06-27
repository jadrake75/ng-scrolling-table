(function (angular) {
    'use strict';
    angular.module('ng-scrolling-table.mixins', [])
    .constant('stgControllerEvents', {
        stateRequest: 'get-state',
        selection: 'selection',
        loadRequested: 'load-requested',
        loadFinished: 'load-finished',
        filter: 'filter'
    })
    .factory('stgControllerMixins', function (stgControllerEvents) {
        $.extend(true, this, {
            filterable: function () {
                return {
                    tableModel: {
                        filter: {
                            text: null
                        }
                    },
                    getFilterProperty: function () {
                        return 'tableModel.filter.text';
                    }
                };
            },
            sortable: function () {
                return {
                    tableModel: {
                        sort: {
                            asc: true,
                            col: null
                        }
                    },
                    isSortedAsc: function (col) {
                        return this.isSortDirection_(col, true);
                    },
                    isSortedDesc: function (col) {
                        return this.isSortDirection_(col, false);
                    },
                    isSortDirection_: function (col, dir) {
                        return (this.tableModel.sort.asc === dir && this.tableModel.sort.col === col);
                    },
                    isSorting: function () {
                        return this.tableModel.sort.col !== null;
                    },
                    sort: function (col) {
                        var sort = this.tableModel.sort;
                        sort.asc = (sort.col === col ? !sort.asc : true);
                        sort.col = col;
                        var state = {};
                        this.$emit(stgControllerEvents.stateRequest, state);
                        this.$emit(stgControllerEvents.loadRequested, state);
                    },
                    clearSort: function () {
                        this.sort(null);
                    },
                    toSortParams: function () {
                        if (this.tableModel.sort.col !== null) {
                            return {
                                $orderby: this.tableModel.sort.col + ' ' + ((this.tableModel.sort.asc) ? 'asc' : 'desc')
                            };
                        } else {
                            return {};
                        }
                    }
                };
            },
            selectable: function (multiple) {
                return {
                    tableModel: {
                        selectedRows: []
                    },
                    isSelected: function (row) {
                        return this.tableModel.selectedRows.indexOf(row) >= 0;
                    },
                    hasSelection: function () {
                        return this.tableModel.selectedRows.length > 0;
                    },
                    clearSelected: function () {
                        this.tableModel.selectedRows.length = 0;
                    },
                    getSelected: function () {
                        return this.tableModel.selectedRows;
                    },
                    selectRow: function (row) {
                        var selectedRows = this.tableModel.selectedRows;
                        var cleared = [];
                        var i = selectedRows.indexOf(row);
                        if (i >= 0) { // remove row selected
                            selectedRows.splice(i, 1);
                            cleared.push(row);
                        }
                        if (!multiple) { // clear all rows
                            angular.forEach(selectedRows, function (item) {
                                cleared.push(item);
                            });
                            selectedRows.length = 0;
                        }
                        if (cleared.indexOf(row) < 0) { // select if not cleared
                            selectedRows.push(row);
                        }
                        this.$emit(stgControllerEvents.selection, selectedRows);
                        return cleared;
                    }
                };
            }
        });
        return this;
    });

})(angular);

//End of file
(function(angular) {
    
    'use strict';
    
    angular.module('table.empty-table', [])
        .directive('stgTableEmpty', function($timeout /*, stgControllerEvents*/) {
        return {
            link: function(scope, el, attrs) {
                var modelData = (attrs.data) ? attrs.data : 'data';
                var msg = (attrs.tableEmpty !== '') ? attrs.tableEmpty : 'No items.';
                var tr = $(document.createElement('tr'));
                $timeout(function() {
                    var body = el.find('tbody');
                    tr.addClass('empty-msg');
                    tr.html('<div>' + msg + '</div>');
                    body.append(tr);
                    tr.show();
                    scope.$watchCollection(modelData, function(val) {
                        if (val.length === 0) {
                            tr.show();
                        } else {
                            tr.hide();
                        }
                    });
                    /*scope.$on(stgControllerEvents.filter, function() {
                        $timeout(function() {
                            var f_tr = body.find('tr');
                            if (f_tr.length > 0 && $(f_tr[0]).hasClass('empty-msg')) {
                                tr.show();
                            } else {
                                tr.hide();
                            }
                        }, 100);
                    });*/
                });

            },
            order: 1
        };
    });
})(angular);
//End of file
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
//End of file
(function(angular) {
    
    'use strict';
    
    angular.module('ng-scrolling-table', [
        'table.scrolling-table', 
        'table.empty-table',
        'table.table-selector',
        'table.highlightColumn'
    ]);
    
})(angular);
//End of file
(function(angular) {

    'use strict';

    var UUID = 0;
    var getUUID = function() {
        return 'scrollingTable-' + UUID++;
    };

    var tables = angular.module('table.scrolling-table', ['net.enzey.service.css.editor']);

    tables.service('stgTableService', function() {
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
        };
    });

    tables.directive('stgScrollingTable', function($timeout, $window, $compile, nzCssRuleEditor, stgTableService) {

        function calculateDimensions(wrapDiv) {
            var header = wrapDiv.find('thead');
            var h = header.find('tr').height();
            h = (h > 0) ? h : 25;
            calculateWidths(wrapDiv);
        }

        function isIE() {
            return ($window.navigator.userAgent.indexOf('MSIE') !== -1 || $window.navigator.appVersion.indexOf('Trident/') > 0);
        }

        function calculateScrollerHeight(tableWrapper) {
            var scroller = tableWrapper.find('.scroller');
            var thHeight = tableWrapper.find('.tableHeader').height();
            scroller.css('max-height', (tableWrapper.height() - thHeight) + "px");
        }

        function calculateWidths(table) {
            var body = table.find("tbody");
            var scroller = body.parents("div.scroller")[0];
            var scrollerWidth = 18; // reasonable default
            var scrollBarVisible = ( scroller.scrollHeight > scroller.clientHeight );
            if( scrollBarVisible ) {
                scrollerWidth = $(scroller).outerWidth() - body[0].clientWidth;
            }
            var allBodyCols = body.find('tr:first td');
            if (allBodyCols.length > 0) {
                table.find('.tableHeader th').each(function(index) {
                    var padding = 0;
                    var desiredWidth = $(allBodyCols[index]).width();
                    if( index === allBodyCols.length -1 && scrollBarVisible ) {
                        desiredWidth = +desiredWidth + scrollerWidth;
                    } else {
                        desiredWidth += ($window.chrome || isIE()) ? 1 : 0;
                    }
                    $(this).width(desiredWidth);
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
                wrapper.css('max-height', maxHeight);
                wrapper.css('height', maxHeight);
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
                $(headerRows[0]).append( $( headersElemArray.join('') ) );

                var bodyRows = wrapper.find('tbody tr');
                var bodyElemArray = [];
                bodyRows.children().each(function(index, wrapper) {
                    bodyElemArray.push(wrapper.outerHTML.match(regexOnlyTagData)[0]);
                });
                $(bodyRows[0]).empty();
                $(bodyRows[0]).append( $( bodyElemArray.join('') ) );

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
                        scope.$watchCollection(modelData, function() {
                            recalcFn();
                        });

                    },
                    post: function(scope, element, attrs) {
                        var cloneHead = $(element.find('thead')[0]).clone();
                        var allMinWidthHeaders = cloneHead.find('th');
                        element.append(cloneHead.removeClass('tableHeader').addClass('minWidthHeaders'));
                        var tableUUID = stgTableService.getIdOfContainingTable(element);
                        for (var i = 0; i < allMinWidthHeaders.length; i++) {
                            var columnRule = nzCssRuleEditor.getCustomRule('#' + tableUUID + ' .tableHeader th:nth-child(' + (i + 1) + ')');
                            columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';
                            var columnRule = nzCssRuleEditor.getCustomRule('#' + tableUUID + ' .scroller td:nth-child(' + (i + 1) + ')');
                            columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';
                        }
                        cloneHead.remove();
                        var debounceId;
                        element.resize(function() {
                            $timeout.cancel(debounceId);
                            debounceId = $timeout(function() {
                                calculateScrollerHeight(element);
                            }, 50, false);

                        });
                        $timeout(function() {
                            calculateScrollerHeight(element);
                            var scroller = element.find('div.scroller');
                            element.find('.tableHeader table').width("calc(100% - " + (scroller.width() - scroller.find('table').width()) + "px)");
                        }, 0, false);
                    }
                }
            }
        };
    });

})(angular);
//End of file
(function(angular) {
    
    'use strict';
    
    angular.module('table.table-selector', ['ng-scrolling-table.mixins'])
    /**
     * This directive will manipulate the row styles to toggle selection on or
     * off.  It will augment the current scope to add the selectable functions
     * to the scope.  The selectRow(index) will be called when this is implemented.
     * 
     * @param {type} ControllerMixins
     * @param {type} $timeout
     * @returns {} The directive instance.
     */
    .directive('stgTableSelector', function(stgControllerMixins, $timeout) {
        return {
            link: function(scope, elm, attrs) {
                var multiSelect = (typeof attrs.multiSelect !== 'undefined');
                $.extend(true, scope, stgControllerMixins.selectable(multiSelect));
                elm.on('click', 'td', function(e) {
                    var row = $(e.currentTarget).closest('tr');
                    var index = row.index();
                    $timeout(function() {
                        var isSelected = row.hasClass('selected');
                        if (!multiSelect) {
                            $(e.currentTarget).closest('tr.selected').removeClass('selected');
                        } else if (isSelected) {
                            row.removeClass('selected');
                        }
                        if (!isSelected) {
                            row.addClass('selected');
                        }
                        var cleared = scope.selectRow(index);
                        if( cleared.length > 0 ) {
                            var rows = row.closest('tbody').find('tr.selected');
                            angular.forEach( cleared, function(clearingRow) {
                                angular.forEach( rows, function(r) {
                                   var _r = $(r);
                                   if(_r.index() === clearingRow) {
                                       _r.removeClass('selected');
                                   }; 
                                });
                            });
                        }
                    }, 0, false);
                });
                elm.on('$destroy', function() {
                    elm.off('click', 'td');
                });
            }
        };
    });
})(angular);