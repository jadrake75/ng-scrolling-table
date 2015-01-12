(function(angular, $) {
    'use strict';
    angular.module('ng-scrolling-table.mixins', [])
            
            .factory('stgControllerMixins', function() {
                $.extend(true, this, {
                    filterable: function() {
                        return {
                            tableModel: {
                                filter: {
                                    text: null
                                }
                            },
                            getFilterProperty: function() {
                                return 'tableModel.filter.text';
                            }
                        };
                    },
                    sortable: function() {
                        return {
                            tableModel: {
                                sort: {
                                    asc: true,
                                    col: null
                                }
                            },
                            isSortedAsc: function(col) {
                                return this.isSortDirection_(col, true);
                            },
                            isSortedDesc: function(col) {
                                return this.isSortDirection_(col, false);
                            },
                            isSortDirection_: function(col, dir) {
                                return (this.tableModel.sort.asc === dir && this.tableModel.sort.col === col);
                            },
                            isSorting: function() {
                                return this.tableModel.sort.col !== null;
                            },
                            sort: function(col) {
                                var sort = this.tableModel.sort;
                                sort.asc = (sort.col === col ? !sort.asc : true);
                                sort.col = col;
                                var state = {};
                                //this.$emit(stgControllerEvents.stateRequest, state);
                                //this.$emit(stgControllerEvents.loadRequested, state);
                            },
                            clearSort: function() {
                                this.sort(null);
                            },
                            toSortParams: function() {
                                if (this.tableModel.sort.col !== null) {
                                    return {
                                        $orderby: this.tableModel.sort.col + ' ' + ((this.tableModel.sort.asc) ? 'asc' : 'desc')
                                    };
                                } else {
                                    return {};
                                }
                            }
                        };
                    }
                    
                });
                return this;
            });

})(angular, jQuery);
