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
