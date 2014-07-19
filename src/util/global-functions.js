var MouseClickObserver = function() {
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
        $(window.document).mouseup(processEvent);
    };

    var processEvent = function(e) {
        var index = -1;
        for (var i = 0; i < containers.length; i++) {
            var container = $(containers[i].selector);
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                container.hide();
                index = i;
                break;
            } else {
                // e.stopPropagation();
            }
        }
        /*if (index >= 0) {
         containers.splice(index, 1);
         if (containers.length === 0) {
         $(window.document).off("mouseup");
         }
         }*/
    };

    return this;
}();
