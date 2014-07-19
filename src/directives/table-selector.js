(function(angular) {

    'use strict';

    angular.module('table.table-selector', ['ng-scrolling-table.mixins'])
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
            .directive('stgTableSelector', function(stgControllerEvents, stgAttributes, $timeout) {

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
                                if( scope.$emit) {
                                    scope.$emit(stgControllerEvents.selection, selectedRows);
                                }
                                return cleared;
                            }
                        };
                    
                    },
                    link: function(scope, elm, attrs) {
                        var refIdAttribute = (typeof attrs.refId !== 'undefined') ? attrs.refId : stgAttributes.refId;
                        var multiSelect = (typeof attrs.multiSelect !== 'undefined' && attrs.multiSelect === "true");
                        scope.selection.setMultiSelect(multiSelect);
                        elm.on('click', 'td', function(e) {
                            var row = $(e.currentTarget).closest('tr');
                            var id = row.attr(refIdAttribute);
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
                                var cleared = scope.selection.selectRow(id);
                                if (cleared.length > 0) {
                                    var rows = row.closest('tbody').find('tr.selected');
                                    angular.forEach(cleared, function(clearingRow) {
                                        angular.forEach(rows, function(r) {
                                            var _r = $(r);
                                            if (_r.attr(refIdAttribute) === clearingRow) {
                                                _r.removeClass('selected');
                                            }
                                            ;
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