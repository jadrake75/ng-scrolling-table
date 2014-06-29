(function(angular) {
    
    'use strict';
    
    angular.module('table.empty-table', [])
        .directive('stgTableEmpty', function($timeout /*, stgControllerEvents*/) {

        return {
            link: function(scope, el, attrs) {
                var modelData = (attrs.data) ? attrs.data : 'data';
                var msg = (attrs.stgTableEmpty !== '') ? attrs.stgTableEmpty : 'No items.';
                var tr = $(document.createElement('tr'));
                var emptyToggleFn = function(val) {
                        if (!val || val.length === 0) {
                            tr.show();
                        } else {
                            tr.hide();
                        } 
                    };
                $timeout(function() {
                    var body = el.find('tbody');
                    tr.addClass('empty-msg');
                    tr.html('<div>' + msg + '</div>');
                    body.append(tr);
                    tr.show();
                    
                    scope.$watchCollection(modelData, emptyToggleFn);
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