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
    .directive('tableSelector', function(ControllerMixins, $timeout) {
        return {
            link: function(scope, elm, attrs) {
                var multiSelect = (typeof attrs.multiSelect !== 'undefined');
                $.extend(true, scope, ControllerMixins.selectable(multiSelect));
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
                        scope.selectRow(index);
                    }, 0, false);
                });
                elm.on('$destroy', function() {
                    elm.off('click', 'td');
                });
            }
        };
    });
})(angular);