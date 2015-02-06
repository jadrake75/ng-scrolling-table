MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

(function(angular, $, Math, MutationObserver) {

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

    tables.service('ScrollingTableHelper', function() {
        return {
            getIdOfContainingTable: function(element) {
                element = $(element); // ensure wrapped
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

    tables.constant('TableEvents', {
        insertRows: 'insert-rows',
        deleteRows: 'delete-rows',
        changeVisibility: 'change-visibility',
        selection: 'select',
        clearSelection: 'clear-selection'
    });

    tables.constant('TableAttributes', {
        refId: 'ref-id',
        columnFixed: 'col-fixed'
    });

    tables.directive('tableScrollingTable', function($timeout, $log, $document, $compile, ScrollingTableHelper, TableAttributes, TableEvents) {

        /**
         * Will ensure that each table row has reference attribute as defined by the refIdAttribute.
         * If no attribute is found, a new guid will be generated and inserted.
         * 
         * @param {type} content The current table content   
         * @param {type} refIdAttribute  The reference ID attribute
         */
        function ensureRowIds(content, refIdAttribute) {
            var trs = content.find('.scroller tr');
            trs.each(function(index, trElem) {
                var tr = $(trElem);
                if (tr.attr(refIdAttribute) === undefined) {
                    tr.attr(refIdAttribute, guid());
                }
            });
        }

        function observeByMutation(tableId, callback) {
            var obs = new MutationObserver(function(mutations, observer) {
                var found = false;
                var mlen = mutations.length;
                for (var i = 0; i < mlen; ++i) {
                    var mutation = mutations[0];
                    var list = (mutation.addedNodes && mutation.addedNodes.length > 0) ?
                            mutation.addedNodes : mutation.removedNodes;
                    var len = list.length;
                    if (len > 0) {
                        for (var j = 0; j < len; j++) {
                            var node = list[j];
                            if (node.tagName === "TR") {
                                found = true;
                                break;
                            }
                        }
                    }
                    if (found) {
                        break;
                    }
                }
                if (found) {
                    callback.apply(this);
                    observer.disconnect();
                }
            });
            var table = $("#" + tableId);
            if (table.length > 0) {
                obs.observe(table.find(" tbody").get(0), {
                    childList: true
                });
            }
            return obs;
        }

        function trackRowChanges(tableId, scope) {
            var lastTimeout = null;
            var lastUpdateTime = (new Date()).getTime();
            var lastCount = 0;

            var updateState = function(len) {
                lastCount = len;
                lastUpdateTime = (new Date()).getTime();
            };
            var checkForChanges = function() {
                if (lastTimeout !== null) {
                    if ($("#" + tableId).length === 0) {
                        $timeout.cancel(lastTimeout);
                        lastTimeout = null;
                        $log.debug("detected removed table from DOM.  Cancelling timers.");
                        return;
                    }
                }
                var trLen = $("#" + tableId + " tbody tr").length;
                if (trLen > lastCount) {
                   // $log.debug("detected the following addditions:" + (trLen - lastCount));
                    scope.$emit(TableEvents.insertRows, {
                        tableId: tableId,
                        inserted: (trLen - lastCount)
                    });
                    updateState(trLen);
                } else if (trLen < lastCount) {
                    //$log.debug("detected the following removals:" + (lastCount - trLen));
                    scope.$emit(TableEvents.deleteRows, {
                        tableId: tableId,
                        deleted: (lastCount - trLen)
                    });
                    updateState(trLen);
                } else {
                    //  $log.debug("no changes detected");
                }

                var delta = (new Date()).getTime() - lastUpdateTime;
                if (delta > 5000) {
                    $log.debug("switching to mutation observation state for... " + tableId);
                    observeByMutation(tableId, checkForChanges);
                } else {
                    var timer = (delta < 2500) ? 250 : 500;
                    //     $log.debug("waiting " + timer + "ms - " + tableId);
                    lastTimeout = $timeout(checkForChanges, timer, false);
                }
            };
            checkForChanges();
        }

        function calculateScrollerHeight(tableWrapper) {
            var scroller = tableWrapper.find('.scroller');
            var header = tableWrapper.find('.tableHeader');
            var delta = tableWrapper.height() - header.height();
            scroller.css('max-height', (Math.min(delta, 250)) + 'px');
            header.css("padding-right", (scroller.width() - scroller.find('table').width()) + "px");
            //$log.debug("scroller height: " + scroller.css('max-height'));
        }

        /**
         * Configures the column groups for both the table header and table body
         * tables.  If a column group is present on the header it will be used.
         * However, if one is generated it will set the widths of any existing 
         * width attributes on the TH elements on the COL elements and remove the 
         * explicit widths from any TH and/or TD cells.
         * 
         * @param $element
         * @param headerTable
         * @param dataTable
         * @param thead
         * @param tbody
         */
        function handleColGroups($element, headerTable, dataTable, thead, tbody) {
            var colGroup = $element.find('colgroup');
            if (colGroup.length === 0) {
                var html = '<colgroup>';
                thead.find('th').each(function(index, elem) {
                    var el = $(elem);
                    var w = null;
                    if (elem.className !== '') {  // if classes are defined attempt to calculate width
                        var elm = el.clone();
                        $($document[0].body).append(elm);
                        w = elm.css("width");
                        elm.remove();
                    }
                    if (el.attr("width") !== undefined) { // explicit width handling
                        w = el.attr("width");
                        el.removeAttr("width");
                        tbody.find('td:nth-child(' + (index + 1) + ')').removeAttr("width");
                    }
                    html += "<col " + ((w !== null) ? 'style="width:' + w + '"' : '') + "/>";
                });
                html += '</colgroup>';
                colGroup = $(html);
                colGroup.appendTo(headerTable);
            } else {
                colGroup.detach().appendTo(headerTable);
            }
            colGroup.clone().appendTo(dataTable);
        }
        
        /**
         * Copy attributes to the wrapper that are not table or column directives
         * and insert a comment block of the the directives into the wrapper
         * 
         * @param {type} element
         * @param {type} wrapper
         * @returns {String}
         */
        function copyAttributesToWrapper(element, wrapper) {
            var attrs = element[0].attributes;
            var comment = '';
            angular.forEach(attrs, function(att, index) {
               var name = att.nodeName;
               // check both data- and table-/col- forms
               if( !(name.indexOf('data-table-') === 0 || name.indexOf('table-') === 0 ||
                       name.indexOf('data-col-') === 0 || name.indexOf('col-') === 0 )) {
                   wrapper.attr( name, att.value );
               } else {
                   if( comment.length === 0 ) {
                       comment += '<!--\n';
                   }
                   comment += '    ' + name + '="' + att.value + '"\n';
               }
            });
            if( comment.length > 0 ) {
                comment += '-->';
            }
            wrapper.prepend(comment);
        }

        return {
            restrict: 'A',
            scope: true,
            terminal: true,
            priority: 1000,
            compile: function compile($element, attrs, transclude) {

                var wrapper = $('<div class="tableWrapper" id="' + guid() + '" data-reorderable-columns>' +
                        '<div class="tableHeader"><table></table></div>' +
                        '<div class="scroller"><table></table></div>' +
                        '</div>');
                var headerTable = $(wrapper.find('.tableHeader table')[0]);
                var dataTable = $(wrapper.find('.scroller table')[0]);
                var thead = $element.find('thead');
                var tbody = $element.find('tbody');
                handleColGroups($element, headerTable, dataTable, thead, tbody);
                thead.each(function(index, elem) {
                    $(elem).detach().appendTo(headerTable);
                });
                tbody.each(function(index, elem) {
                    $(elem).detach().appendTo(dataTable);
                });
                copyAttributesToWrapper($element, wrapper);
                var maxHeight = $element.css('max-height');
                if ((!maxHeight || maxHeight === 'none') && attrs.height) {
                    maxHeight = attrs.height + 'px';
                }
                var alwaysScroll = ( attrs.tableAlwaysScroll === 'true');
                var scroller = wrapper.find('.scroller');
                if( alwaysScroll ) {
                    scroller.css( 'overflow-y', 'scroll');
                }
                wrapper.css({
                    'max-height': maxHeight,
                    'height': maxHeight
                });
                $element.after(wrapper);
                $element.remove();

                // Regex strips illegal markup from element
                //   which causes render failures in IE
                var regexOnlyTagData = '<.*>';
                var headerRows = headerTable.find('tr');
                var headersElemArray = [];
                headerRows.children().each(function(index, wrapper) {
                    headersElemArray.push(wrapper.outerHTML.match(regexOnlyTagData)[0]);
                });
                headerRows.empty();
                headerRows.append($(headersElemArray.join('')));

                var bodyRows = dataTable.find('tr');
                var bodyElemArray = [];
                bodyRows.children().each(function(index, wrapper) {
                    bodyElemArray.push(wrapper.outerHTML.match(regexOnlyTagData)[0]);
                });
                bodyRows.empty();
                bodyRows.append($(bodyElemArray.join('')));

                return {
                    // Will run BEFORE child directives.
                    pre: function(scope, element, attrs) {
                        scope.headersElemArray = headersElemArray;
                        scope.bodyElemArray = bodyElemArray;

                        $compile(wrapper, null, 1000)(scope);
                    },
                    post: function(scope, element, attrs) {
                        var refIdAttribute = (typeof attrs.refId !== 'undefined') ? attrs.refId : TableAttributes.refId;
                        var cloneHead = element.find('.tableHeader thead').first().clone();
                        // angularJS will update the classes so we need to re-apply the tableWrapper class to the wrapping DIV
                        var classes = element.attr('class');
                        if(!classes ) {
                            classes = '';
                        }
                        element.attr('class', 'tableWrapper ' + classes);
                        // we can likely remove the min-width on the headers
                        var allMinWidthHeaders = cloneHead.find('th');
                        element.append(cloneHead);
                        var tableUUID = ScrollingTableHelper.getIdOfContainingTable(element);
                        var minLen = allMinWidthHeaders.length;
                        for (var i = 0; i < minLen ; i++) {
                            var width = $(allMinWidthHeaders[i]).width() + 'px';
                            element.find('.tableHeader th:nth-child(' + (i + 1) + ')').css("minWidth", width);
                        }
                        cloneHead.remove();
                        var calcId;
                        var calcFn = function(evt, data) {
                            var id = data.tableId;
                            // during resize the resize will not emit the data element so we need
                            // to get the id from the event target
                            if( !id && evt.currentTarget ) {
                                id = evt.currentTarget.id;
                            }
                            if (id === tableUUID) {
                                processFn(element, refIdAttribute);
                            }
                        };
                        var processFn = function(element,refIdAttribute) {
                            calculateScrollerHeight(element);
                            ensureRowIds(element, refIdAttribute);
                        };
                        
                        processFn(element, refIdAttribute);
                        $("#" + tableUUID).resize(calcFn);

                        trackRowChanges(tableUUID, scope);
                        scope.$on(TableEvents.insertRows, calcFn);
                        scope.$on(TableEvents.deleteRows, calcFn);
                    }
                };
            }
        };
    });

})(angular, jQuery, Math, MutationObserver);