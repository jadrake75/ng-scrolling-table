(function(angular, $) {
    'use strict';

    var module = angular.module("table.column-resizing", ["ng-scrolling-table.mixins"]);

    /**
     * Support the ability to resize columns on the table.  Placing this directive
     * on a TABLE element will enable all columns to be resizable except for the 
     * last column on the right.  As well any column that declares the column-fixed="true"
     * attribute will be excluded from resizing.
     * 
     * @param {constant} stgAttributes Constants for the fixed column attributes
     */
    module.directive("stgEnableColumnResizing", function(stgAttributes) {
        return {
            link: function(scope, el, attrs) {
                var p = $(el).closest(".tableWrapper");
                var last = el.find("thead th:last-child()")[0];
                // Change the cursor on mouse moving within a TH element near
                // the right most limit for resizing.  
                // Note: column-fixed columns will not expose the handle
                // 
                // If this becomes expensive to calculate we could add a mouseenter
                // to add the mouse move and then remove it on exit, but this does
                // not seem to impact performance with over 50 columns visible.
                el.find("thead th").mousemove(function(evt) {
                    var elm = $(evt.target);
                    var w = elm.outerWidth();
                    if ( last.cellIndex !== evt.target.cellIndex && 
                            (w - evt.offsetX) < 10 && 
                            elm.attr(stgAttributes.columnFixed) !== "true" ) {
                        elm.css("cursor", "col-resize");
                    } else {
                        elm.css("cursor","");
                    }
                });
                // Look for a mouse down event occuring near the TH's boundary.
                el.find("thead tr").mousedown(function(evt) {
                    var target = $(evt.target);
                    
                    if( last.cellIndex === evt.target.cellIndex || 
                            target[0].nodeName !== "TH" || 
                            target.outerWidth() - evt.offsetX > 10 || 
                            target.attr(stgAttributes.columnFixed) === "true" ) {
                        return;
                    }
                    var x = evt.screenX;
                    var current = $(evt.currentTarget);
                    var cursor = $("body").css("cursor");
                    // Add mouse move if the target is eligible for drag
                    current.mousemove(function(evtUp){ 
                        $("body").css("cursor", "col-resize");
                        var delta = evtUp.screenX - x;
                        x = evtUp.screenX;
                        var w_x = target.outerWidth() + delta;
                        var min = target.css("min-width"); // respect minimum
                        min = +min.substring(0, min.length - 2); // remove px
                        var w =  Math.max(w_x,min) + "px";
                        // TODO: Add maximum support
                        var cols = p.find("col:nth-child(" + (target[0].cellIndex+1) + ")");
                        cols.attr("width", w);
                        
                    });
                    current.mouseup(function(evt2) {
                        $("body").css("cursor", cursor);
                        current.off("mousemove");
                        current.off("mouseup");
                    });
                });

            }
        };
    });
})(angular, jQuery);