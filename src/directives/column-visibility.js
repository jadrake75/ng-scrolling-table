(function(angular, $, MouseClickObserver, Math) {
    "use strict";

    var module = angular.module("table.column-visibility", ["table.scrolling-table"]);
    module.factory("ColumnVisibilityService", function($timeout) {
        this.setColumnVisibility = function(tableId, index, showColumn) {
            // Currently setting visibility on the COL tag is not supported, so we 
            // are forced to use classes on the TD and TRs
            var col = $("#" + tableId + " col:nth-child(" + (index + 1) + ")");
            var ths = $("#" + tableId + " th:nth-child(" + (index + 1) + ")");
            var tds = $("#" + tableId + " td:nth-child(" + (index + 1) + ")");
            if (!showColumn) {
                ths.addClass("col-hidden");
                tds.addClass("col-hidden");
                col.addClass("col-hidden");
            } else {
                col.removeClass("col-hidden");
                tds.removeClass("col-hidden");
                ths.removeClass("col-hidden");
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
    });
    module.directive("tableVisibilityMenu", function($compile, $timeout, $window, ColumnVisibilityService, ScrollingTableHelper) {
        var findHidden = function(tableId, col) {
            return $("#" + tableId + " th:nth-child(" + (col + 1) + ")").hasClass("col-hidden");
        };

        return {
            restrict: 'AE',
            controller: function($scope) {
                $scope.toggleVisibilityCallback = function(tableId, col) {
                    var hidden = findHidden(tableId, col);
                    ColumnVisibilityService.setColumnVisibility(tableId, col, hidden);
                    $scope.colVisibilityModel["col-" + col] = hidden;
                };
            },
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
                        var ths = $("#" + tableId + " thead th");
                        var menu = $(".column-menu");
                        if (menu.length === 0) {
                            $("body").append("<div class='column-menu'></div>");
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
    });
    module.directive("colVisibility", function($log, $timeout, ScrollingTableHelper, ColumnVisibilityService, tableEvents) {
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
                        listener = scope.$on(tableEvents.insertRows, function() {
                            ColumnVisibilityService.setColumnVisibility(tableId, index, visible);
                        });
                        ColumnVisibilityService.setColumnVisibility(tableId, index, visible);
                    };
                    scope.$on(tableEvents.changeVisibility, function(evt, data) {
                        if (data.tableId && data.tableId === tableId && data.elm === el.get()[0]) {
                            showColumn = data.visible;
                            ColumnVisibilityService.setVisibility(showColumn);
                        }
                    });
                    setVisibility(showColumn);
                }
            }
        };
    });
})(angular, jQuery, MouseClickObserver, Math);