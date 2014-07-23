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

        var tbody = elm.find("tbody");
        var repeater = tbody.find("tr:first-child()");
        var r = repeater.attr("ng-repeat");
        if (!r || r === "") {
            r = repeater.attr("data-ng-repeat");
        }
        var findText = function(s) {
            if (s) {
                var indx = s.indexOf(" in ");
                if (indx > 0) {
                    s = s.substring(indx + 4);
                    if (s.indexOf(" ") > 0) {
                        s = s.substring(0, s.indexOf(" "));
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
