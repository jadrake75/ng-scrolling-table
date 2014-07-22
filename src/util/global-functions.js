function isFirefox() {
    return (window.mozInnerScreenX !== undefined);
};

function isIE() {
    return (window.navigator.userAgent.indexOf('MSIE') !== -1 || window.navigator.appVersion.indexOf('Trident/') > 0);
}

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
