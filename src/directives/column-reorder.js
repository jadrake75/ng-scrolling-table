(function(angular) {
    "use strict";

    var module = angular.module('table.column-reorder', ['net.enzey.services.events']);

    module.directive('reorderableColumns', function() {
        var incrementedId = 0;
        var getId = function() {
            return 'colId' + incrementedId++;
        };

        return {
            controller: function($scope) {
                var templateMapper = {};

                this.getTemplate = function(rowId) {
                    return templateMapper[rowId];
                };

                this.setTemplate = function(rowId, template) {
                    if (!templateMapper[rowId]) {
                        templateMapper[rowId] = template;
                    }
                };

                this.reorderColumns = function(oldColIndex, newColIndex, offset) {

                    if (oldColIndex === null || newColIndex === null) {
                        return;
                    }

                    oldColIndex = +oldColIndex;
                    newColIndex = +newColIndex;

                    if (oldColIndex < 0 || newColIndex < 0) {
                        return;
                    }

                    if (oldColIndex < newColIndex) {
                        newColIndex--;
                    }

                    Object.keys(templateMapper).forEach(function(rowId) {
                        var rowTemplate = templateMapper[rowId];
                        rowTemplate = angular.element('<tr>' + rowTemplate + '<tr>');
                        rowTemplate = angular.element(rowTemplate[0].children);

                        var columnCount = rowTemplate.length;
                        if (oldColIndex >= columnCount || newColIndex >= columnCount) {
                            return;
                        }

                        if (offset < 0) {
                            // Insert Before
                            var oldColumn = rowTemplate.splice(oldColIndex, 1)[0];
                            rowTemplate.splice(newColIndex, 0, oldColumn);
                        } else if (offset > 0) {
                            // Insert After
                            var oldColumn = rowTemplate.splice(oldColIndex, 1)[0];
                            rowTemplate.splice(newColIndex + 1, 0, oldColumn);
                        } else {
                            // Swap Column Places
                            var oldColumn = rowTemplate.splice(oldColIndex, 1)[0];
                            var newColumn = rowTemplate.splice(newColIndex, 1)[0];
                            rowTemplate.splice(newColIndex, 0, oldColumn);
                            rowTemplate.splice(oldColIndex, 0, newColumn);
                        }

                        var newRowTemplate = '';
                        for(var i = 0; i < rowTemplate.length; i++) {
                            newRowTemplate += rowTemplate[i].outerHTML;
                        }

                        templateMapper[rowId] = newRowTemplate;
                    });

                    $scope.$broadcast('drawTableRows');
                }

            },
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

    module.directive('reorderableColumnTemplateMapper', function($compile) {
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
    });

    module.directive('reorderableHeaderDragDrop', function(nzEventHelper) {
        return {
            require: '^reorderableColumns',
            compile: function($element, $attrs) {

                return {
                    pre: function (scope, element, attrs, ReorderColCtrl) {

                        var removeHoverClasses = function() {
                            element.removeClass('dropLeft');
                            element.removeClass('dropCenter');
                            element.removeClass('dropRight');
                        };

                        var getElementHoverOffset =  function(event) {
                            var boundingRect = element[0].getBoundingClientRect();
                            var hoverSectionWidth = boundingRect.width / 3;
                            if (event.pageX < (boundingRect.left + hoverSectionWidth)) {
                                // Left 1/3 of Element
                                return -1;
                            } else if (event.pageX > (boundingRect.left + hoverSectionWidth + hoverSectionWidth)) {
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

                        nzEventHelper.registerDropHandler(element[0], 'columnReorder',
                            function(event) {
                                // Drag Enter
                            },
                            function(event) {
                                // Drag Over
                                removeHoverClasses();
                                var elementHoverOffset = getElementHoverOffset(event);
                                if (elementHoverOffset < 0) {
                                    element.addClass('dropLeft');
                                } else if (elementHoverOffset > 0) {
                                    element.addClass('dropRight');
                                } else {
                                    element.addClass('dropCenter');
                                }
                            },
                            function(event) {
                                // Drag Leave
                                removeHoverClasses();
                            },
                            function(dragElement, dropElement, event) {
                                // Drop
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
    });

})(angular);