(function(angular) {

    'use strict';
    
    var tables = angular.module('table.scrolling-table', []);

	tables.directive('scrollingTable', function($timeout) {
        var linker = function(scope, element, attrs) {
            var modelData = (attrs.data) ? attrs.data : 'data';
            var wrapper = element.wrap('<div class="tableWrapper"><div class="scroller"></div></div>').parents('.tableWrapper');
            wrapper.resize(function() {
                calculateDimensions(wrapper);
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
                    var desiredWidth = $(allBodyCols[index]).width() - padding + (( index === 0 ) ? -2 : 0);
                    $(this).width(desiredWidth);
                });
            }
        }
        return {
            restrict: 'A',
            link: linker
        };
    });
	
})(angular);