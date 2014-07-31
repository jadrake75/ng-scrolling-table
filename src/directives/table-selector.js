(function(angular) {

    'use strict';

    angular.module('table.table-selector', ["table.scrolling-table"])
            /**
             * This directive will manipulate the row styles to toggle selection on or
             * off.  It will augment the parent scope (scope that contains the table)
             * to add the selectable functions
             * to the scope.  The selectRow(id) will be called when this is implemented.
             * 
             * @param {type} ControllerMixins
             * @param {type} $timeout
             * @returns {} The directive instance.
             */
            .directive('tableSelector', function($timeout, $log, TableEvents, TableAttributes, ScrollingTableHelper) {

                return {
                    controller: function($scope) {
                        var scope = $scope.$parent;
                        var multiple = false;
                        scope.tableModel = {
                            selectedRows: []
                        },
                        scope.selection = {
                            isSelected: function(row) {
                                return scope.tableModel.selectedRows.indexOf(row) >= 0;
                            },
                            hasSelection: function() {
                                return scope.tableModel.selectedRows.length > 0;
                            },
                            clearSelected: function() {
                                scope.tableModel.selectedRows.length = 0;
                            },
                            getSelected: function() {
                                return scope.tableModel.selectedRows;
                            },
                            setMultiSelect: function(multi) {
                                multiple = multi;
                            },
                            selectRow: function(id) {
                                var selectedRows = scope.tableModel.selectedRows;
                                var cleared = [];
                                var i = selectedRows.indexOf(id);
                                if (i >= 0) { // remove row selected
                                    selectedRows.splice(i, 1);
                                    cleared.push(id);
                                }
                                if (!multiple) { // clear all rows
                                    angular.forEach(selectedRows, function(item) {
                                        cleared.push(item);
                                    });
                                    selectedRows.length = 0;
                                }
                                if (cleared.indexOf(id) < 0) { // select if not cleared
                                    selectedRows.push(id);
                                }
                                if (scope.$emit) {
                                    scope.$emit(TableEvents.selection, {
                                        selected: selectedRows
                                    });
                                }
                                return cleared;
                            }
                        };

                    },
                    link: function(scope, elm, attrs) {
                        var tableId = ScrollingTableHelper.getIdOfContainingTable(elm);
                        var refIdAttribute = (typeof attrs.refId !== 'undefined') ? attrs.refId : TableAttributes.refId;
                        var multiSelect = (typeof attrs.tableMultiSelect !== 'undefined' && attrs.tableMultiSelect === "true");
                        scope.selection.setMultiSelect(multiSelect);
                        elm.on('click', 'td', function(e) {
                            var row = $(e.currentTarget).closest('tr');
                            var id = row.attr(refIdAttribute);
                            $timeout(function() {
                                var isSelected = row.hasClass('selected');
                                if (!multiSelect) {
                                    $(e.currentTarget).closest('tr.selected').each(function() {
                                        this.classList.remove('selected');
                                    });
                                } else if (isSelected) {
                                    row[0].classList.remove('selected');
                                }
                                if (!isSelected) {
                                    row[0].classList.add('selected');
                                }
                                var cleared = scope.selection.selectRow(id);
                                if (cleared.length > 0) {
                                    var rows = row.closest('tbody').find('tr.selected');
                                    angular.forEach(cleared, function(clearingRow) {
                                        angular.forEach(rows, function(r) {
                                            var _r = $(r);
                                            if (_r.attr(refIdAttribute) === clearingRow) {
                                                r.classList.remove('selected');
                                            }
                                            ;
                                        });
                                    });
                                }
                            }, 0, false);
                        });
                        scope.$on(TableEvents.clearSelection, function(evt, data) {
                            if (!data || !data.tableId) {
                                $log.error("A tableId parameter is required to clear selection.");
                                return;
                            }
                            if (scope.selection && data.tableId && data.tableId === tableId) {
                                scope.selection.clearSelected();
                                $timeout(function() {
                                    elm.find("tbody tr.selected").each(function() {
                                        this.classList.remove('selected');
                                    });
                                }, 0, false);
                            }
                        });
                        elm.on('$destroy', function() {
                            elm.off('click', 'td');
                        });
                    }
                };
            });
})(angular);