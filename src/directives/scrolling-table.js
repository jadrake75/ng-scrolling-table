(function(angular) {

    'use strict';

    var tables = angular.module('table.scrolling-table', []);

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

    tables.directive('scrollingTable', function($timeout, $window) {
        var linker = function(scope, element, attrs) {
            var modelData = (attrs.data) ? attrs.data : 'data';
            var maxHeight = element.css('height');
            element.css('height', 0);

            var wrapper = element.wrap('<div class="tableWrapper"><div class="scroller"></div></div>').parents('.tableWrapper');
            wrapper.find('.scroller').css('max-height', maxHeight);

            var debounceId;
            $($window).resize(function() {
                $timeout.cancel(debounceId);
                debounceId = $timeout(function() {
                    calculateDimensions(wrapper);
                }, 100, false);
            });
            var headWrap = $(document.createElement('div'))
                    .addClass('tableHeader')
                    .prependTo(wrapper);
            $(document.createElement('table'))
                    .appendTo(headWrap)
                    .css("width", "100%");

            var recalcFn = function() {
                $timeout(function() {
                    calculateDimensions(wrapper);
                }, 50);
            };

            scope.$watch(modelData, function() {
                recalcFn();
            });
        };

        function calculateDimensions(wrapDiv) {
            var header = wrapDiv.find('thead');
            var body = wrapDiv.find("tbody");
            var innerWrap = body.parents('div.scroller');
            var headerTable = wrapDiv.find('div.tableHeader table');
            headerTable.append(header);
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
                table.find('tr th').each(function(index) {
                    var padding = 0;
                    var desiredWidth = $(allBodyCols[index]).width();
                    $(this).css('max-width', desiredWidth);
                });
            }
        }

        return {
            restrict: 'A',
            link: linker
        };
    });

})(angular);