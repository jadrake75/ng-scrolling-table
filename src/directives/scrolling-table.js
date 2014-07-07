(function(angular) {

    'use strict';

    var UUID = 0;
    var getUUID = function() {
        return 'scrollingTable-' + UUID++;
    };
    
    var guid = (function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
        }
        return function() {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
        };
    })();

    var tables = angular.module('table.scrolling-table', ['net.enzey.service.css.editor']);

    tables.service('stgTableService', function() {
        return {
            getIdOfContainingTable: function(element) {
                var tableContainer = element.closest('.tableWrapper');
                if (tableContainer && tableContainer[0]) {
                    return tableContainer[0].id;
                }

                // The element with the directive was passed.
                tableContainer = element.find('.tableWrapper');
                if (tableContainer && tableContainer.length === 1) {
                    return tableContainer[0].id;
                }
            }
        };
    });

    tables.directive('stgScrollingTable', function($timeout, $window, $compile, nzCssRuleEditor, stgTableService, stgAttributes) {

        /**
         * Will ensure that each table row has reference attribute as defined by the refIdAttribute.
         * If no attribute is found, a new guid will be generated and inserted.
         * 
         * @param {type} content The current table content   
         * @param {type} refIdAttribute  The reference ID attribute
         */
        function ensureRowIds(content, refIdAttribute) {
            var trs = content.find('tbody tr');
            trs.each(function(index, trElem) {
                var tr = $(trElem);
                if( tr.attr && tr.attr(refIdAttribute) === undefined ) {
                   tr.attr(refIdAttribute, guid());
                }
            });
        }
        
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
                var tableUUID = getUUID();
               
                var wrapper = $('<div class="tableWrapper"></div>');
                wrapper.attr('id', tableUUID);

                var headWrap = $('<div class="tableHeader"><table></table></div>');
                var bodyWrap = $('<div class="scroller"><table></table></div>');
                wrapper.append(headWrap).append(bodyWrap);

                var headerTable = $(headWrap.find('table')[0]);
                var dataTable =  $(bodyWrap.find('table')[0]);
                $element.find('thead').each(function(index, elem) {
                    $(elem).detach().appendTo(headerTable);
                });
                $element.find('tbody').each(function(index, elem) {
                    $(elem).detach().appendTo(dataTable);
                });

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
                var headersElemArray = [];
                headerRows.children().each(function(index, wrapper) {
                    headersElemArray.push(wrapper.outerHTML.match(regexOnlyTagData)[0]);
                });
                $(headerRows[0]).empty();
                $(headerRows[0]).append( $( headersElemArray.join('') ) );

                var bodyRows = wrapper.find('tbody tr');
                var bodyElemArray = [];
                bodyRows.children().each(function(index, wrapper) {
                    bodyElemArray.push(wrapper.outerHTML.match(regexOnlyTagData)[0]);
                });
                $(bodyRows[0]).empty();
                $(bodyRows[0]).append( $( bodyElemArray.join('') ) );

                return {
                    // Is run BEFORE child directives.
                    pre: function(scope, element, attrs) {
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
                        var refIdAttribute = ( typeof attrs.refId !== 'undefined' ) ? attrs.refId : stgAttributes.refId;
                        var cloneHead = $(element.find('thead')[0]).clone();
                        var allMinWidthHeaders = cloneHead.find('th');
                        element.append(cloneHead.removeClass('tableHeader').addClass('minWidthHeaders'));
                        var tableUUID = stgTableService.getIdOfContainingTable(element);
                        for (var i = 0; i < allMinWidthHeaders.length; i++) {
                            var columnRule = nzCssRuleEditor.getCustomRule('#' + tableUUID + ' .tableHeader th:nth-child(' + (i + 1) + ')');
                            columnRule.minWidth = $(allMinWidthHeaders[i]).width() + 'px';
                            var columnRule = nzCssRuleEditor.getCustomRule('#' + tableUUID + ' .scroller td:nth-child(' + (i + 1) + ')');
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
                        $timeout(function() {
                            calculateScrollerHeight(element);
                            var scroller = element.find('div.scroller');
                            ensureRowIds(scroller, refIdAttribute);
                            element.find('.tableHeader table').width("calc(100% - " + (scroller.width() - scroller.find('table').width()) + "px)");
                            
                        }, 0, false);
                    }
                }
            }
        };
    });

})(angular);