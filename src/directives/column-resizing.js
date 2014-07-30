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
    module.directive("tableColumnsResizable", function($timeout, $document, TableAttributes) {
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
    });
})(angular, jQuery, Math);