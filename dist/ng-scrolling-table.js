(function(angular) {
    
    'use strict';
    
    angular.module('table.empty-table', [])
        .directive('tableEmpty', function($timeout /*, ControllerEvents*/) {
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
                    /*scope.$on(ControllerEvents.filter, function() {
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
    
    angular.module('ng-scrolling-table', [
        'table.scrolling-table', 
        'table.empty-table'
    ]);
    
})(angular);
//End of file
(function(angular) {

    'use strict';

    var UUID = 0;
    var getUUID = function() {
        return 'scrollingTable-' + UUID++;
    }

    var tables = angular.module('table.scrolling-table', ['net.enzey.service.css.editor']);

    var ctrlBind = function($parse) {
        return function($scope) {
            $scope.$watch = function(varExpression, func) {
            // varExpression.exp is passed as the 'old' value
            //   so that angular can remove the expression text from an
            //   element's attributes, such as when using an expression for the class.
                func($parse(varExpression)($scope), varExpression.exp);
            };
        };
    };

    var linkBind = function($timeout) {
        return function(scope, element, attrs) {
            $timeout(function() {
                scope.$destroy();
            }, 0, false);
        };
    };

    tables.directive('noBind', function ($parse, $timeout) {
        return {
            restrict: 'A',
            priority: 9999,
            scope: true,
            controller: ctrlBind($parse),
            link: linkBind($timeout)
        };
    });

    tables.directive('noBindChildren', function ($parse, $timeout) {
        return {
            restrict: 'A',
            priority: -9999,
            scope: true,
            controller: ctrlBind($parse),
            link: linkBind($timeout)
        };
    });

    tables.directive('scrollingTable', function($timeout, $window, nzCssRuleEditor) {
        var tableUUID = getUUID();
        var linker = function(scope, element, attrs) {

            var modelData = (attrs.data) ? attrs.data : 'data';
            var maxHeight = element.css('height');
            element.css('height', 0);

            var wrapper = element.wrap('<div class="tableWrapper"><div class="scroller"></div></div>').parents('.tableWrapper');
            wrapper.find('.scroller').css('max-height', maxHeight);
            wrapper.attr('id', tableUUID);

            var debounceId;
            $($window).resize(function() {
                $timeout.cancel(debounceId);
                debounceId = $timeout(function() {
                    calculateDimensions(wrapper);
                }, 50, false);
            });
            var headWrap = $(document.createElement('div'))
                    .addClass('tableHeader')
                    .prependTo(wrapper);
            var foo = $(document.createElement('table'))
                    .appendTo(headWrap)
                    .css("width", "100%");

            var recalcFn = function() {
                $timeout(function() {
                    calculateDimensions(wrapper);
                }, 50);
            };

            foo.append(wrapper.find('thead'));
            var cloneFoo = headWrap.clone();
            wrapper.append(cloneFoo.removeClass('tableHeader').addClass('dummyTable'));

            scope.$watch(modelData, function() {
                recalcFn();
            });
            $timeout(function() {
                var allMinWidthHeaders = cloneFoo.find('th');
                for (var i=0; i < allMinWidthHeaders.length; i++) {
                    var columnRule = nzCssRuleEditor.getRule('#' + tableUUID + ' .tableHeader th:nth-child(' + (i+1) + ')');
                    columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';
                    var columnRule = nzCssRuleEditor.getRule('#' + tableUUID + ' .scroller td:nth-child(' + (i+1) + ')');
                    columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';
                }
            }, 1, false);
        };

        function calculateDimensions(wrapDiv) {
            var header = wrapDiv.find('thead');
            var body = wrapDiv.find("tbody");
            var innerWrap = body.parents('div.scroller');
            var h = header.find('tr').height();
            h = (h > 0) ? h : 25;
            innerWrap.height(wrapDiv.height() - h);
            calculateWidths(wrapDiv);
        }

        function calculateWidths(table) {
            var allBodyCols = table.find('tbody tr:first td');
            var scroller = table.find('div.scroller');
            table.find('.tableHeader table').width("calc(100% - " + (scroller.width() - scroller.find('table').width()) + "px)");
            if (allBodyCols.length > 0) {
                table.find('.tableHeader tr th').each(function(index) {
                    var padding = 0;
                    var desiredWidth = $(allBodyCols[index]).width();
                    $(this).css('width', desiredWidth);
                    //$(this).css('min-width', desiredWidth);
                });
            }
        }

        return {
            restrict: 'A',
            link: linker
        };
    });

})(angular);