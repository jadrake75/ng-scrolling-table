(function(angular) {

    'use strict';

    var guid = (function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
        }
        return function() {
            return 's' + s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
        };
    })();

    var tables = angular.module('table.scrolling-table', []);

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

    tables.directive('stgScrollingTable', function($timeout, $window, $document, stgTableService, stgAttributes) {

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

        function isIE() {
            return ($window.navigator.userAgent.indexOf('MSIE') !== -1 || $window.navigator.appVersion.indexOf('Trident/') > 0);
        }

        function calculateScrollerHeight(tableWrapper) {
            var scroller = tableWrapper.find('.scroller');
            var thHeight = tableWrapper.find('.tableHeader').height();
            scroller.css('max-height', (tableWrapper.height() - thHeight) + "px");
        }

        /**
         * Configures the column groups for both the table header and table body
         * tables.  If a column group is present on the header it will be used.
         * However, if one is generated it will set the widths of any existing 
         * width attributes on the TH elements on the COL elements and remove the 
         * explicit widths from any TH and/or TD cells.
         */
        function handleColGroups($element, headerTable, dataTable, thead, tbody) {
            var colGroup = $element.find('colgroup').first();
            if (colGroup.length === 0) {
                colGroup = $('<colgroup></colgroup>');
                thead.find('th').each(function(index, elem) {
                    var el = $(elem);
                    var w = null;
                    if( elem.className !== '') {  // if classes are defined attempt to calculate width
                        var elm = el.clone();
                        $($document[0].body).append(elm);
                        w = elm.css("width");
                        elm.remove();
                    }
                    if (el.attr("width") !== undefined) { // explicit width handling
                        w = el.attr("width");
                        el.removeAttr("width");
                        tbody.find("td:nth-child(" + (index + 1) + ")").removeAttr("width");
                    }
                    colGroup.append("<col " + ((w !== null) ? "width=\"" + w + "\"" : "") + "/>");
                });
                colGroup.appendTo(headerTable);
            } else {
                colGroup.detach().appendTo(headerTable);
            }
            colGroup.clone().appendTo(dataTable);
            
        }

        return {
            restrict: 'A',
            scope: true,
            compile: function compile($element, attrs, transclude) {
               
                var wrapper = $('<div class="tableWrapper"></div>');
                wrapper.attr('id', guid());

                var headWrap = $('<div class="tableHeader"><table></table></div>');
                var bodyWrap = $('<div class="scroller"><table></table></div>');
                wrapper.append(headWrap).append(bodyWrap);

                var headerTable = $(headWrap.find('table')[0]);
                var dataTable =  $(bodyWrap.find('table')[0]);
                var thead = $element.find('thead');
                var tbody = $element.find('tbody');
                handleColGroups($element, headerTable, dataTable, thead, tbody);
                thead.each(function(index, elem) {
                    $(elem).detach().appendTo(headerTable);
                });
                tbody.each(function(index, elem) {
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
                        scope.headersElemArray = headersElemArray;
                        scope.bodyElemArray = bodyElemArray;
                    },
                    post: function(scope, element, attrs) {
                        var refIdAttribute = ( typeof attrs.refId !== 'undefined' ) ? attrs.refId : stgAttributes.refId;
                        var cloneHead = $(element.find('thead')[0]).clone();
                        var allMinWidthHeaders = cloneHead.find('th');
                        element.append(cloneHead.removeClass('tableHeader').addClass('minWidthHeaders'));
                        var tableUUID = stgTableService.getIdOfContainingTable(element);
                        for (var i = 0; i < allMinWidthHeaders.length; i++) {
                            var width = $(allMinWidthHeaders[i]).width() + 'px';
                            $('#' + tableUUID + ' .tableHeader th:nth-child(' + (i + 1) + ')').css("minWidth", width);
                            $('#' + tableUUID + ' .scroller td:nth-child(' + (i + 1) + ')').css("minWidth", width);
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
                            element.find('.tableHeader').css("padding-right",(scroller.width() - scroller.find('table').width()) + "px");
                        }, 0, false);
                    }
                }
            }
        };
    });

})(angular);