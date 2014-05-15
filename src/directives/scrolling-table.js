(function(angular) {

    'use strict';

    var UUID = 0;
    var getUUID = function() {
        return 'scrollingTable-' + UUID++;
    };

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

            var wrapper = element.wrap('<div class="tableWrapper"><div class="scroller"></div></div>').parents('.tableWrapper');
            var maxHeight = element.css('max-height');
            if( (!maxHeight || maxHeight === 'none') && attrs.height ) {
                maxHeight = attrs.height + 'px';
            }
            wrapper.find('.scroller').css('max-height', maxHeight);
            element.css('max-height', 0);
            wrapper.attr('id', tableUUID);

            var debounceId;
            var recalcFn = function() {
                $timeout.cancel(debounceId);
                debounceId = $timeout(function() {
                    calculateDimensions(wrapper);
                }, 25, false);
            };
            element.resize(function() {
                recalcFn();
            });
            var headWrap = $(document.createElement('div'))
                    .addClass('tableHeader')
                    .prependTo(wrapper);
            var headTable = $(document.createElement('table'))
                    .appendTo(headWrap)
                    .css("width", "100%");

            headTable.append(wrapper.find('thead'));
            var cloneHead = headWrap.clone();
            wrapper.append(cloneHead.removeClass('tableHeader').addClass('dummyTable'));

            scope.$watch(modelData, function() {
                recalcFn();
            });
            
            $timeout(function() {
                var allMinWidthHeaders = cloneHead.find('th');
                for (var i=0; i < allMinWidthHeaders.length; i++) {
                    var columnRule = nzCssRuleEditor.getRule('#' + tableUUID + ' .tableHeader th:nth-child(' + (i+1) + ')');
                    columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';
               /* This is a performance problem...    
                * var columnRule = nzCssRuleEditor.getRule('#' + tableUUID + ' .scroller td:nth-child(' + (i+1) + ')');
                    columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';*/
                }
            }, 0, false);
        };

        function calculateDimensions(wrapDiv) {
            var header = wrapDiv.find('thead');
            var body = wrapDiv.find("tbody");
            var h = header.find('tr').height();
            h = (h > 0) ? h : 25;
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
                });
            }
        }

        return {
            restrict: 'A',
            link: linker
        };
    });

})(angular);