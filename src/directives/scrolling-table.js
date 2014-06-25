(function(angular) {

    'use strict';

    var UUID = 0;
    var getUUID = function() {
        return 'scrollingTable-' + UUID++;
    };

    var tables = angular.module('table.scrolling-table', ['net.enzey.service.css.editor']);

    tables.directive('stgScrollingTable', function($timeout, $window, $compile, nzCssRuleEditor) {

        function calculateDimensions(wrapDiv) {
            var header = wrapDiv.find('thead');
            var h = header.find('tr').height();
            h = (h > 0) ? h : 25;
            calculateWidths(wrapDiv);
        }

        function isIE() {
            return ($window.navigator.userAgent.indexOf('MSIE') !== -1 || $window.navigator.appVersion.indexOf('Trident/') > 0);
        }

        function calculateScrollerHeight(tableWrapper) {
            var scroller = tableWrapper.find('.scroller');
            var thHeight = tableWrapper.find('.tableHeader').height();
            scroller.css('max-height', (tableWrapper.height() - thHeight) + "px");
        }

        function calculateWidths(table) {
            var body = table.find("tbody");
            var scroller = body.parents("div.scroller")[0];
            var scrollerWidth = 18; // reasonable default
            var scrollBarVisible = ( scroller.scrollHeight > scroller.clientHeight );
            if( scrollBarVisible ) {
                scrollerWidth = $(scroller).outerWidth() - body[0].clientWidth;
            }
            var allBodyCols = body.find('tr:first td');
            if (allBodyCols.length > 0) {
                table.find('.tableHeader th').each(function(index) {
                    var padding = 0;
                    var desiredWidth = $(allBodyCols[index]).width();
                    if( index === allBodyCols.length -1 && scrollBarVisible ) {
                        desiredWidth = +desiredWidth + scrollerWidth;
                    } else {
                        desiredWidth += ($window.chrome || isIE()) ? 1 : 0;
                    }
                    $(this).width(desiredWidth);
                });
            }
        }

        return {
            restrict: 'A',
            scope: true,
            compile: function compile($element, attrs, transclude) {
                var wrapper = $('<div class="tableWrapper"></div>');

                var headWrap = $('<div class="tableHeader"><table></table></div>');
                var bodyWrap = $('<div class="scroller"><table></table></div>');
                wrapper.append(headWrap).append(bodyWrap);

                var moveRowsToDifferentTable = function(oldLocation, newElem) {
                    $element.find( oldLocation ).each(function(index, elem) {
                        $(elem).detach().appendTo(newElem);
                    });
                };
                moveRowsToDifferentTable('thead', $(headWrap.find('table')[0]));
                moveRowsToDifferentTable('tbody', $(bodyWrap.find('table')[0]));

                var maxHeight = $element.css('max-height');
                if( (!maxHeight || maxHeight === 'none') && attrs.height ) {
                    maxHeight = attrs.height + 'px';
                }
                wrapper.css('max-height', maxHeight);
                wrapper.css('height', maxHeight);
                $element.css('max-height', 0);

                $element.after(wrapper);
                $element.remove();

                // Regex strips illegal markup from element
                //   which causes render failures in IE
                var regexOnlyTagData = '<.*>';

                var headerRows = wrapper.find('thead tr');
                var bodyRows = wrapper.find('tbody tr');

                var getAttributes = function(element) {
                    var attrs = {};
                    for (var i=0; i < element.attributes.length; i++) {
                        attrs[element.attributes[i].name] = element.attributes[i].value;
                    }
                    return attrs;
                };
                var headerTrAttrs = getAttributes(headerRows[0]);
                var bodyTrAttrs =   getAttributes(bodyRows[0]);

                var headersElemArray = [];
                headerRows.children().each(function(index, elem) {
                    headersElemArray.push(elem.outerHTML.match(regexOnlyTagData)[0]);
                });

                var bodyElemArray = [];
                bodyRows.children().each(function(index, elem) {
                    bodyElemArray.push(elem.outerHTML.match(regexOnlyTagData)[0]);
                });

                return {
                    // Is run BEFORE child directives.
                    pre: function(scope, element, attrs) {
                        scope.tableUUID = getUUID();
                        wrapper.attr('id', scope.tableUUID);

                        var modelData = (attrs.data) ? attrs.data : 'data';
                        scope.headersElemArray = headersElemArray;
                        scope.bodyElemArray = bodyElemArray;

                        var debounceId;
                        var recalcFn = function() {
                            $timeout.cancel(debounceId);
                            debounceId = $timeout(function() {
                                calculateDimensions(element);
                            }, 25, false);
                        };
                        $($window).resize(function() {
                            recalcFn();
                        });
                        scope.$watchCollection(modelData, function() {
                            recalcFn();
                        });

                    },
                    post: function(scope, element, attrs) {
                        var cloneHead = $(element.find('thead')[0]).clone();
                        var allMinWidthHeaders = cloneHead.find('th');
                        element.append(cloneHead.removeClass('tableHeader').addClass('minWidthHeaders'));
                        for (var i = 0; i < allMinWidthHeaders.length; i++) {
                            var columnRule = nzCssRuleEditor.getCustomRule('#' + scope.tableUUID + ' .tableHeader th:nth-child(' + (i + 1) + ')');
                            columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';
                            var columnRule = nzCssRuleEditor.getCustomRule('#' + scope.tableUUID + ' .scroller td:nth-child(' + (i + 1) + ')');
                            columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';
                        }
                        cloneHead.remove();

                        var debounceId;
                        element.resize(function() {
                            $timeout.cancel(debounceId);
                            debounceId = $timeout(function() {
                                calculateScrollerHeight(element);
                            }, 50, false);
                        });

                        var rebuild = function(elemType, elemAttrs, childElemArray) {
                            var elem = wrapper.find(elemType);
                            elem.empty();
                            var newElem = angular.element('<tr></tr>');
                            Object.keys(elemAttrs).forEach(function(key) {
                                newElem.attr(key, elemAttrs[key]);
                            });
                            newElem.append( $( childElemArray.join('') ) );
                            elem.append( $compile(newElem)(scope) );
                        };
                        scope.rebuildTable = function() {
                            rebuild('tbody', bodyTrAttrs, scope.bodyElemArray);
                            rebuild('thead', headerTrAttrs, scope.headersElemArray);
                        };

                        $timeout(function() {
                            calculateScrollerHeight(element);
                            var scroller = element.find('div.scroller');
                            element.find('.tableHeader table').width("calc(100% - " + (scroller.width() - scroller.find('table').width()) + "px)");
                        }, 0, false);
                    }
                }
            }
        };
    });

})(angular);