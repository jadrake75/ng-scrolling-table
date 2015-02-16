function isFirefox() {
    return (window.mozInnerScreenX !== undefined);
}
;

function isIE() {
    return (window.navigator.userAgent.indexOf('MSIE') !== -1 || window.navigator.appVersion.indexOf('Trident/') > 0);
}

var RepeaterUtilities = function($) {

    var NGREPEAT_TEXT = "ngRepeat:";
    /**
     * Find the repeater collection variable from the ng-repeat statement.
     * 
     * @param {type} elm  The top level table
     * @returns {String} the name of the collection
     */
    this.extractCollection = function(elm) {

        var tbody = $(elm).find("tbody");
        var repeater = tbody.find("tr:first-child()");
        var r = repeater.attr("ng-repeat");
        if (!r || r === "") {
            r = repeater.data("ng-repeat");
        }
        var findText = function(s) {
            if (s) {
                var indx = s.indexOf(" in ");
                if (indx > 0) {
                    s = s.substring(indx + 4);
                    indx = s.search(/( )|(\|)|(\")+/ig);
                    if (indx > 0) {
                        s = s.substring(0, indx);
                    }
                }
            }
            return s;
        };
        r = findText(r);
        // If the collection is empty it will not render any trs so the first
        // repeater will fail to find anything of value.  In these cases the
        // comments can be examined to find a ngRepeat.
        if (!r || r === "") {
            tbody.contents().filter(function() {
                return this.nodeType === 8;
            }).each(function(i, e) {
                var val = e.nodeValue;
                if (val.indexOf(NGREPEAT_TEXT) >= 0) {
                    var rep = val.substring(val.indexOf(NGREPEAT_TEXT) + NGREPEAT_TEXT.length);
                    r = findText(rep);
                    return false;
                }
            });
        }
        return r;
    };
    
    return this;
}(jQuery);

var MouseClickObserver = function($, angular, window) {
    var containers = [];

    this.addContainer = function(container) {
        var found = false;
        angular.forEach(containers, function(c) {
            if (c === container) {
                found = true;
            }
        });
        if (!found) {
            containers.push(container);
        }
        $(window.document).on("mouseup", processEvent);
    };

    var processEvent = function(e) {
        var index = -1;
        for (var i = 0; i < containers.length; i++) {
            var container = $(containers[i].selector);
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                if (container.css("display") !== "none") {
                    containers.splice(i, 1);
                    if (containers.length === 0) {
                        $(window.document).off("mouseup");
                    }
                    container.hide();
                }
                break;
            } else {
                // e.stopPropagation();
            }
        }
    };

    return this;
}(jQuery, angular, window);

//End of file
(function(angular, $) {
    'use strict';
    angular.module('ng-scrolling-table.mixins', [])
            
            .factory('stgControllerMixins', function() {
                $.extend(true, this, {
                    filterable: function() {
                        return {
                            tableModel: {
                                filter: {
                                    text: null
                                }
                            },
                            getFilterProperty: function() {
                                return 'tableModel.filter.text';
                            }
                        };
                    },
                    sortable: function() {
                        return {
                            tableModel: {
                                sort: {
                                    asc: true,
                                    col: null
                                }
                            },
                            isSortedAsc: function(col) {
                                return this.isSortDirection_(col, true);
                            },
                            isSortedDesc: function(col) {
                                return this.isSortDirection_(col, false);
                            },
                            isSortDirection_: function(col, dir) {
                                return (this.tableModel.sort.asc === dir && this.tableModel.sort.col === col);
                            },
                            isSorting: function() {
                                return this.tableModel.sort.col !== null;
                            },
                            sort: function(col) {
                                var sort = this.tableModel.sort;
                                sort.asc = (sort.col === col ? !sort.asc : true);
                                sort.col = col;
                                var state = {};
                                //this.$emit(stgControllerEvents.stateRequest, state);
                                //this.$emit(stgControllerEvents.loadRequested, state);
                            },
                            clearSort: function() {
                                this.sort(null);
                            },
                            toSortParams: function() {
                                if (this.tableModel.sort.col !== null) {
                                    return {
                                        $orderby: this.tableModel.sort.col + ' ' + ((this.tableModel.sort.asc) ? 'asc' : 'desc')
                                    };
                                } else {
                                    return {};
                                }
                            }
                        };
                    }
                    
                });
                return this;
            });

})(angular, jQuery);

//End of file
(function(angular, $) {
    "use strict";
    var module = angular.module("table.column-fixed", []);
    
    module.directive('colFixed', function() {
        return {
            restrict: 'CA',
            link: function(scope, elm, attr ) {
                if(attr.colFixed === "false") {
                    return;
                }
                var width = elm.width();
                $(elm).css({
                    "min-width": width,
                    "max-width": width
                });
            }
        };
    });
})(angular, jQuery);
//End of file
(function(angular) {
    "use strict";

    var module = angular.module('table.column-reorder', ['net.enzey.services.events']);

    module.directive('reorderableColumns', function() {
        var incrementedId = 0;
        var getId = function() {
            return 'colId' + incrementedId++;
        };

        return {
            controller: ["$scope","$element", function($scope, $element) {
                var swapEnabled = false;
                var ctrl = this;

                this.isSwapEnabled = function() {
                    return !!swapEnabled;
                };

                this.maxSideDropSize = function() {
                    return 50;
                };

                var tableElems = [];
                if ($element) {
                    if ($element[0].tagName === 'TABLE') {
                        tableElems.push($element[0]);
                    } else {
                        var tables = $element[0].querySelectorAll('table');
                        for (var i = 0; i < tables.length; i++) {
                            tableElems.push(tables[i]);
                        }
                    }
                }

                var templateMapper = {};

                this.getTemplate = function(rowId) {
                    return templateMapper[rowId];
                };

                this.setTemplate = function(rowId, template) {
                    if (!templateMapper[rowId]) {
                        templateMapper[rowId] = template;
                    }
                };

                var reorder = function(array, newIndex, oldIndex, offset) {
                    if (oldIndex < newIndex) {
                        newIndex--;
                    }

                    var columnCount = array.length;
                    if (oldIndex >= columnCount || newIndex >= columnCount) {
                        return;
                    }

                    if (offset < 0) {
                        // Insert Before
                        var oldColumn = array.splice(oldIndex, 1)[0];
                        array.splice(newIndex, 0, oldColumn);
                    } else if (offset > 0) {
                        // Insert After
                        var oldColumn = array.splice(oldIndex, 1)[0];
                        array.splice(newIndex + 1, 0, oldColumn);
                    } else if (ctrl.isSwapEnabled()) {
                        // Swap Column Places
                        var oldColumn = array.splice(oldIndex, 1)[0];
                        var newColumn = array.splice(newIndex, 1)[0];
                        array.splice(newIndex, 0, oldColumn);
                        array.splice(oldIndex, 0, newColumn);
                    }

                    return array;
                };

                this.reorderColumns = function(oldColIndex, newColIndex, offset) {

                    if (oldColIndex === null || newColIndex === null || oldColIndex === newColIndex) {
                        return;
                    }
                    oldColIndex = +oldColIndex;
                    newColIndex = +newColIndex;
                    offset = parseInt(offset);
                    if (oldColIndex < 0 || newColIndex < 0 || offset < -1 || offset > 1) {
                        return;
                    }
                    if (!ctrl.isSwapEnabled() && offset === 0) {
                        return;
                    }

                    // Reorder COL Elements
                    tableElems.forEach(function(tableElem) {
                        var colElems = tableElem.querySelectorAll('col');

                        var reorderedColElems = angular.element(colElems);
                        reorderedColElems = reorder(reorderedColElems, newColIndex, oldColIndex, offset);
                        reorderedColElems = reorderedColElems.map(function(index, elem) {
                            return elem.cloneNode();
                        });
                        var firstModifiedColumn = Math.min(newColIndex, oldColIndex);
                        reorderedColElems = reorderedColElems.slice(firstModifiedColumn, Math.max(newColIndex, oldColIndex) + 1);

                        reorderedColElems.each(function (index, colElement) {
                            var colElementStyles = colElement.style;
                            Object.keys(colElementStyles).forEach(function(styleKey) {
                                colElems[index + firstModifiedColumn].style[styleKey] = colElementStyles[styleKey];
                            });
                        });
                    });

                    // Reorder Row Templates
                    Object.keys(templateMapper).forEach(function(rowId) {
                        var rowTemplate = templateMapper[rowId];
                        rowTemplate = angular.element('<tr>' + rowTemplate + '<tr>');
                        rowTemplate = angular.element(rowTemplate[0].children);

                        var rowTemplate = reorder(rowTemplate, newColIndex, oldColIndex, offset);
                        if (rowTemplate) {
                            var newRowTemplate = '';
                            for(var i = 0; i < rowTemplate.length; i++) {
                                newRowTemplate += rowTemplate[i].outerHTML;
                            }

                            templateMapper[rowId] = newRowTemplate;
                        }
                    });

                    $scope.$broadcast('drawTableRows');
                }

            }],
            compile: function($element, $attrs) {
                var headerRow = $element[0].querySelector('thead tr');
                headerRow.setAttribute('reorderable-column-template-mapper', getId());

                var headers = headerRow.querySelectorAll('th');
                var headerCount = headers.length;
                while (headerCount--) {
                    headers[headerCount].setAttribute('reorderable-header-drag-drop', '');
                }

                var bodyRows = $element[0].querySelectorAll('tbody tr');
                var bodyRowCount = bodyRows.length;
                while (bodyRowCount--) {
                    bodyRows[bodyRowCount].setAttribute('reorderable-column-template-mapper', getId());
                }

            }
        }
    });

    module.directive('reorderableColumnTemplateMapper', ["$compile", function($compile) {
        return {
            require: '^reorderableColumns',
            compile: function($element, $attrs) {
                var directiveName = this.name;
                var rowId = $attrs[directiveName];

                var uncompiledHtml = $element[0].innerHTML;
                $element.empty();

                return {
                    pre: function (scope, element, attrs, ReorderColCtrl) {
                        ReorderColCtrl.setTemplate(rowId, uncompiledHtml);

                        var buildRow = function() {
                            element.empty();
                            var rowTemplate = ReorderColCtrl.getTemplate(rowId);
                            rowTemplate = angular.element(rowTemplate);
                            element.append(rowTemplate);
                            $compile(rowTemplate)(scope);
                        };
                        buildRow();

                        scope.$on('drawTableRows', buildRow);
                    }
                }

            }
        }
    }]);

    module.directive('reorderableHeaderDragDrop', ["nzEventHelper","$timeout", function(nzEventHelper, $timeout) {
        return {
            require: '^reorderableColumns',
            compile: function($element, $attrs) {

                return {
                    pre: function (scope, element, attrs, ReorderColCtrl) {

                        var allDropIndicatorClasses = [
                            'dropLeft',
                            'dropRight',
                            'dropCenter'
                        ];
                        var removeHoverClasses = function(classToRetain) {
                            allDropIndicatorClasses.forEach(function(dropIndicatorClass) {
                                if (classToRetain !== dropIndicatorClass) {
                                    element.removeClass(dropIndicatorClass);
                                }
                            });
                        };

                        var getElementHoverOffset =  function(event) {
                            var boundingRect = element[0].getBoundingClientRect();
                            var hoverSectionWidth = boundingRect.width / 2;
                            if (ReorderColCtrl.isSwapEnabled()) {
                                hoverSectionWidth = boundingRect.width / 3;
                            }
                            hoverSectionWidth = Math.min(hoverSectionWidth, ReorderColCtrl.maxSideDropSize());
                            if (event.pageX < (boundingRect.left + hoverSectionWidth)) {
                                // Left 1/3 of Element
                                return -1;
                            } else if (event.pageX > (boundingRect.left + boundingRect.width - hoverSectionWidth)) {
                                // Right 1/3 of element
                                return 1;
                            } else {
                                return 0;
                            }
                        };

                        nzEventHelper.registerDragHandler(element[0], 'columnReorder',
                            function(event) {
                                // Start Drag
                                element.addClass('columnDrag');
                            },
                            function(event) {
                                // End Drag
                                element.removeClass('columnDrag');
                            }
                        );

                        var dragActionId;
                        nzEventHelper.registerDropHandler(element[0], 'columnReorder',
                            function(event) {
                                // Drag Enter
                            },
                            function(event) {
                                $timeout.cancel(dragActionId);
                                dragActionId = $timeout(function() {
                                    // Drag Over
                                    var elementHoverOffset = getElementHoverOffset(event);
                                    var dropIndicatorClass;
                                    if (elementHoverOffset < 0) {
                                        dropIndicatorClass = 'dropLeft';
                                    } else if (elementHoverOffset > 0) {
                                        dropIndicatorClass = 'dropRight';
                                    } else if (ReorderColCtrl.isSwapEnabled()) {
                                        dropIndicatorClass = 'dropCenter';
                                    }
                                    element.addClass(dropIndicatorClass);
                                    removeHoverClasses(dropIndicatorClass);
                                }, 2, false);
                            },
                            function(event) {
                                // Drag Leave
                                $timeout.cancel(dragActionId);
                                removeHoverClasses();
                            },
                            function(dragElement, dropElement, event) {
                                // Drop
                                $timeout.cancel(dragActionId);
                                removeHoverClasses();

                                var dragIndex = null;
                                var dropIndex = null;

                                var headerRowElem = dragElement.parentElement;
                                if (headerRowElem === dropElement.parentElement) {
                                    var headerElems = headerRowElem.children;
                                    for (var i = 0; i < headerElems.length; i++) {
                                        var header = headerElems[i];
                                        if (header === dragElement) {
                                            dragIndex = i;
                                        } else if (header === dropElement) {
                                            dropIndex = i;
                                        }
                                    }
                                }

                                ReorderColCtrl.reorderColumns(dragIndex, dropIndex, getElementHoverOffset(event));
                                scope.$apply();
                            }
                        );

                    }
                }

            }
        }
    }]);

})(angular);
//End of file
(function(angular, $, Math) {
    'use strict';

    var module = angular.module("table.column-resizing", ["table.scrolling-table"]);

    /**
     * Support the ability to resize columns on the table.  Placing this directive
     * on a TABLE element will enable all columns to be resizable except for the 
     * last column on the right.  As well any column that declares the column-fixed="true"
     * attribute will be excluded from resizing.
     * 
     * @param {constant} TableAttributes Constants for the fixed column attributes
     */
    module.directive("tableColumnsResizable", ["$timeout","$document","TableAttributes", function($timeout, $document, TableAttributes) {
        var findXDistance = function(evt, elm) {
            var x = evt.offsetX;
            // Firefox does not recognize the offsetX property
            if (x === undefined) {
                x = evt.pageX - elm.offset().left;
            }
            return x;
        };
        return {
            link: function(scope, el, attrs) {
                var body = $($document[0].body);
                $timeout(function() {
                    var p = $(el).closest(".tableWrapper");
                    var last = el.find("thead th:last-child()")[0];
                    // Change the cursor on mouse moving within a TH element near
                    // the right most limit for resizing.  
                    // Note: col-fixed columns will not expose the handle
                    // 
                    // If this becomes expensive to calculate we could add a mouseenter
                    // to add the mouse move and then remove it on exit, but this does
                    // not seem to impact performance with over 50 columns visible.
                    el.find("thead th").mousemove(function(evt) {
                        var elm = $(evt.target);
                        var w = elm.outerWidth();
                        var x = findXDistance(evt, elm);
                        if (last.cellIndex !== evt.target.cellIndex &&
                                (w - x) < 10 &&
                                !elm.hasClass(TableAttributes.columnFixed) &&
                                elm.attr(TableAttributes.columnFixed) !== "true") {
                            elm.css("cursor", "col-resize");
                        } else {
                            elm.css("cursor", "");
                        }
                    });
                    // Look for a mouse down event occuring near the TH's boundary.
                    el.find("thead tr").mousedown(function(evt) {
                        var target = $(evt.target);
                        var x = findXDistance(evt, target);
                        if (last.cellIndex === evt.target.cellIndex ||
                                target[0].nodeName !== "TH" ||
                                target.outerWidth() - x > 10 ||
                                target.hasClass(TableAttributes.columnFixed) ||
                                target.attr(TableAttributes.columnFixed) === "true") {
                            return;
                        }
                        var s_x = evt.screenX;
                        var current = $(evt.currentTarget);
                        var cursor = body.css("cursor");
                        // Add mouse move if the target is eligible for drag
                        current.mousemove(function(evtUp) {
                            body.css("cursor", "col-resize");
                            var delta = evtUp.screenX - s_x;
                            s_x = evtUp.screenX;
                            var w_x = target.outerWidth() + delta;
                            var min = target.css("min-width"); // respect minimum
                            min = +min.substring(0, min.length - 2); // remove px
                            var w = Math.max(w_x, min) + "px";
                            // TODO: Add maximum support
                            var cols = p.find("col:nth-child(" + (target[0].cellIndex + 1) + ")");
                            cols.attr("width", w);

                        });
                        current.mouseup(function(evt2) {
                            body.css("cursor", cursor);
                            current.off("mousemove");
                            current.off("mouseup");
                        });
                    });
                }, 0, false);


            }
        };
    }]);
})(angular, jQuery, Math);
//End of file
(function(angular, $, MouseClickObserver, Math) {
    "use strict";

    var module = angular.module("table.column-visibility", ["table.scrolling-table"]);
    module.factory("ColumnVisibilityService", ["$timeout", function($timeout) {
        this.setColumnVisibility = function(tableId, index, showColumn) {
            // Currently setting visibility on the COL tag is not supported, so we 
            // are forced to use classes on the TD and TRs
            var col = $("#" + tableId + " col:nth-child(" + (index + 1) + ")");
            var ths = $("#" + tableId + " th:nth-child(" + (index + 1) + ")");
            var tds = $("#" + tableId + " td:nth-child(" + (index + 1) + ")");
            // The use of an .each iterator + native add/remove is shown to show about a
            // 50% increase in performance on large data sets.  It is not a heavy operation
            // and the savings are small overall.
            if (!showColumn) {
                ths.each(function() {
                    this.classList.add("col-hidden");
                });
                tds.each(function() {
                    this.classList.add("col-hidden");
                });
                col.each(function() {
                    this.classList.add("col-hidden");
                });
            } else {
                ths.each(function() {
                    this.classList.remove("col-hidden");
                });
                tds.each(function() {
                    this.classList.remove("col-hidden");
                });
                col.each(function() {
                    this.classList.remove("col-hidden");
                });
            }
            // firefox requires a change to the border-collapse to get the columns to align
            if (isFirefox()) {
                $timeout(function() {
                    $("#" + tableId + " td").css({
                        "width": "100%"
                    });
                }, 0, false);
            }
        };
        return this;
    }]);
    module.directive("tableVisibilityMenu", ["$compile","$timeout","$document","$window","ColumnVisibilityService","ScrollingTableHelper", function($compile, $timeout, $document, $window, ColumnVisibilityService, ScrollingTableHelper) {
        var findHidden = function(tableId, col) {
            return $("#" + tableId + " th:nth-child(" + (col + 1) + ")").hasClass("col-hidden");
        };

        return {
            restrict: 'AE',
            controller: ["$scope", function($scope) {
                $scope.toggleVisibilityCallback = function(tableId, col) {
                    var hidden = findHidden(tableId, col);
                    ColumnVisibilityService.setColumnVisibility(tableId, col, hidden);
                    $scope.colVisibilityModel["col-" + col] = hidden;
                };
            }],
            link: function(scope, el, attrs) {
                $(el).on("click", function() {
                    $timeout(function() {
                        scope.colVisibilityModel = [];
                        var tableId = ScrollingTableHelper.getIdOfContainingTable(el);
                        if (!tableId) {
                            var p = el.parent();
                            while (!tableId && p.length > 0) {
                                tableId = ScrollingTableHelper.getIdOfContainingTable(p.find(".tableWrapper"));
                                p = p.parent();
                            }
                        }
                        var ths = $("#" + tableId + " th");
                        var menu = $(".column-menu");
                        if (menu.length === 0) {
                            $($document[0].body).append("<div class='column-menu'></div>");
                            menu = $(".column-menu");
                        }
                        var html = "<ul>";
                        ths.each(function(idx, th) {
                            var hidden = findHidden(tableId, th.cellIndex);
                            scope.colVisibilityModel["col-" + th.cellIndex] = !hidden;
                            html += "<li><input type='checkbox' ng-model='colVisibilityModel[\"col-" + th.cellIndex + "\"]' ng-change='toggleVisibilityCallback(\"" + tableId + "\"," + th.cellIndex + ")'>" + $(th).text() + "</li>";
                        });
                        html += "</ul>";
                        var markup = $compile(html)(scope);
                        menu.html(markup);
                        var pos = el.position();
                        var left = Math.min($($window).width() - menu.width() - 15, pos.left + 5);
                        menu.css({
                            left: left,
                            top: pos.top + 5
                        });
                        menu.show();
                        MouseClickObserver.addContainer(menu);
                    });
                });
            }
        };
    }]);
    module.directive("colVisibility", ["$log","ScrollingTableHelper","ColumnVisibilityService","TableEvents", function($log, ScrollingTableHelper, ColumnVisibilityService, TableEvents) {
        return {
            restrict: "A",
            link: function(scope, el, attrs) {
                var tagName = el[0].tagName;
                if (tagName !== "COL" && tagName !== "TH") {
                    $log.error("Using col-visibility on an element " + tagName + " is not supported.");
                    return;
                }
                var tableId = ScrollingTableHelper.getIdOfContainingTable(el);
                var listener = null;
                if (tableId) {
                    var showColumn = true;
                    if (attrs.colVisibility === "hidden" || attrs.colVisibility === "false") {
                        showColumn = false;
                    }
                    var setVisibility = function(visible) {
                        var index = el.parent().children().toArray().indexOf(el[0]);
                        if (listener !== null) {
                            listener();
                        }
                        listener = scope.$on(TableEvents.insertRows, function() {
                            ColumnVisibilityService.setColumnVisibility(tableId, index, visible);
                        });
                        ColumnVisibilityService.setColumnVisibility(tableId, index, visible);
                    };
                    scope.$on(TableEvents.changeVisibility, function(evt, data) {
                        if (data.tableId && data.tableId === tableId && data.elm === el.get()[0]) {
                            showColumn = data.visible;
                            ColumnVisibilityService.setVisibility(showColumn);
                        }
                    });
                    setVisibility(showColumn);
                }
            }
        };
    }]);
})(angular, jQuery, MouseClickObserver, Math);
//End of file
(function(angular, $, RepeaterUtilities) {

    'use strict';

    var module = angular.module('table.empty-table', []);
    module.directive('tableEmptyMessage', ["$timeout","$log", function($timeout, $log) {
       
        return {
            link: function(scope, el, attrs) {
                var msg = (attrs.tableEmptyMessage !== '') ? attrs.tableEmptyMessage : 'No items.';
                var tr = $('<tr class="empty-msg"></tr>');
                var emptyToggleFn = function(val) {
                    if (!val || val.length === 0) {
                        tr.show();
                    } else {
                        tr.hide();
                    }
                };
                $timeout(function() {
                    var modelData = RepeaterUtilities.extractCollection(el);                   
                    if( modelData === undefined ) {
                        $log.warn("no model data found.");
                    }
                    var tbody = el.find("tbody");
                    var rowCount = tbody.find("tr").length;
                    tr.append('<div>' + msg + '</div>');
                    tbody.append(tr);
                    if( rowCount > 0) {
                        tr.hide();
                    }
                    if( modelData ) {
                        scope.$watchCollection(modelData, emptyToggleFn);
                    }
                },0, false);
            }
        };
    }]);
})(angular, jQuery, RepeaterUtilities);
//End of file
(function(angular, $) {

    'use strict';

    var tables = angular.module('table.highlightColumn', ["table.scrolling-table"]);

    tables.directive('colHighlight', ["$timeout","$log","ScrollingTableHelper","TableEvents", function($timeout, $log, ScrollingTableHelper, TableEvents) {

        /**
         * Track new insertions of TRs into the TBODY and specify for the
         * column TDs the listeners to bind.
         * 
         * @param {type} tableId
         * @param {type} index
         * @returns {undefined}
         */
        function handleInsertions(tableId, index) {
            var tds = $("#" + tableId + " tbody td:nth-child(" + (index + 1) + ")");
            addListeners(tds);
        }

        function addListeners(elems) {
            elems.off("mouseenter mouseleave"); // remove all previously added ones
            elems.hover(function() {
                // use iterator + native classList functions for performance improvements of 50%
                elems.each(function() {
                    this.classList.add("col-highlight");
                });
            }, function() {
                elems.each(function() {
                    this.classList.remove("col-highlight");
                });
            });
        }

        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var tagName = element[0].tagName;
                if (tagName !== "COL" && tagName !== "TH") {
                    $log.error("Using col-highlight on an element " + tagName + " is not supported.");
                    return;
                }
                var tableId = ScrollingTableHelper.getIdOfContainingTable(element);
                if (tableId) {
                    var index = element.parent().children().toArray().indexOf(element[0]);
                    if (index !== undefined) {
                        $timeout(function() {
                           handleInsertions(tableId, index);
                        }, 0, false);
                        scope.$on(TableEvents.insertRows, function(len) {
                            handleInsertions(tableId, index);
                        });
                    }
                    scope.$on('$destroy', function() {
                        var tds = $("#" + tableId + " tbody td:nth-child(" + (index + 1) + ")");
                        tds.off("mouseenter mouseleave");
                    });
                }
            }
        };
    }]);

})(angular, jQuery);
//End of file
(function(angular) {
    
    'use strict';
    
    angular.module('ng-scrolling-table', [
        'table.scrolling-table', 
        'table.empty-table',
        'table.table-selector',
        'table.highlightColumn',
        'table.column-resizing',
        'table.column-visibility',
        'table.column-reorder',
        'table.column-fixed'
    ]);
    
})(angular);
//End of file
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

    tables.directive('tableScrollingTable', ["$timeout","$log","$document","$compile","ScrollingTableHelper","TableAttributes","TableEvents", function($timeout, $log, $document, $compile, ScrollingTableHelper, TableAttributes, TableEvents) {

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
            angular.forEach(attrs, function(att, index) {
                // check both data- and table-/col- forms
                wrapper.attr( att.nodeName, att.value );
            });
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
    }]);

})(angular, jQuery, Math, MutationObserver);
//End of file
(function(angular) {

    'use strict';

    angular.module('table.table-selector', ["table.scrolling-table"])
            /**
             * This directive will manipulate the row styles to toggle selection on or
             * off.  It will augment the parent scope (scope that contains the table)
             * to add the selectable functions
             * to the scope.  The selectRow(id) will be called when this is implemented.
             * 
             * @param {type} ControllerMixins
             * @param {type} $timeout
             * @returns {} The directive instance.
             */
            .directive('tableSelector', ["$timeout","$log","TableEvents","TableAttributes","ScrollingTableHelper", function($timeout, $log, TableEvents, TableAttributes, ScrollingTableHelper) {

                return {
                    controller: ["$scope", function($scope) {
                        var scope = $scope.$parent;
                        var multiple = false;
                        scope.tableModel = {
                            selectedRows: []
                        },
                        scope.selection = {
                            isSelected: function(row) {
                                return scope.tableModel.selectedRows.indexOf(row) >= 0;
                            },
                            hasSelection: function() {
                                return scope.tableModel.selectedRows.length > 0;
                            },
                            clearSelected: function() {
                                scope.tableModel.selectedRows.length = 0;
                            },
                            getSelected: function() {
                                return scope.tableModel.selectedRows;
                            },
                            setMultiSelect: function(multi) {
                                multiple = multi;
                            },
                            selectRow: function(id) {
                                var selectedRows = scope.tableModel.selectedRows;
                                var cleared = [];
                                var i = selectedRows.indexOf(id);
                                if (i >= 0) { // remove row selected
                                    selectedRows.splice(i, 1);
                                    cleared.push(id);
                                }
                                if (!multiple) { // clear all rows
                                    angular.forEach(selectedRows, function(item) {
                                        cleared.push(item);
                                    });
                                    selectedRows.length = 0;
                                }
                                if (cleared.indexOf(id) < 0) { // select if not cleared
                                    selectedRows.push(id);
                                }
                                if (scope.$emit) {
                                    scope.$emit(TableEvents.selection, {
                                        selected: selectedRows
                                    });
                                }
                                return cleared;
                            }
                        };

                    }],
                    link: function(scope, elm, attrs) {
                        var tableId = ScrollingTableHelper.getIdOfContainingTable(elm);
                        var refIdAttribute = (typeof attrs.refId !== 'undefined') ? attrs.refId : TableAttributes.refId;
                        var multiSelect = (typeof attrs.tableMultiSelect !== 'undefined' && attrs.tableMultiSelect === "true");
                        scope.selection.setMultiSelect(multiSelect);
                        elm.on('click', 'td', function(e) {
                            var row = $(e.currentTarget).closest('tr');
                            var id = row.attr(refIdAttribute);
                            $timeout(function() {
                                var isSelected = row.hasClass('selected');
                                if (!multiSelect) {
                                    $(e.currentTarget).closest('tr.selected').each(function() {
                                        this.classList.remove('selected');
                                    });
                                } else if (isSelected) {
                                    row[0].classList.remove('selected');
                                }
                                if (!isSelected) {
                                    row[0].classList.add('selected');
                                }
                                var cleared = scope.selection.selectRow(id);
                                if (cleared.length > 0) {
                                    var rows = row.closest('tbody').find('tr.selected');
                                    angular.forEach(cleared, function(clearingRow) {
                                        angular.forEach(rows, function(r) {
                                            var _r = $(r);
                                            if (_r.attr(refIdAttribute) === clearingRow) {
                                                r.classList.remove('selected');
                                            }
                                            ;
                                        });
                                    });
                                }
                            }, 0, false);
                        });
                        scope.$on(TableEvents.clearSelection, function(evt, data) {
                            if (!data || !data.tableId) {
                                $log.error("A tableId parameter is required to clear selection.");
                                return;
                            }
                            if (scope.selection && data.tableId && data.tableId === tableId) {
                                scope.selection.clearSelected();
                                $timeout(function() {
                                    elm.find("tbody tr.selected").each(function() {
                                        this.classList.remove('selected');
                                    });
                                }, 0, false);
                            }
                        });
                        elm.on('$destroy', function() {
                            elm.off('click', 'td');
                        });
                    }
                };
            }]);
})(angular);