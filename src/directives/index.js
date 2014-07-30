(function(angular) {
    
    'use strict';
    
    angular.module('ng-scrolling-table', [
        'table.scrolling-table', 
        'table.empty-table',
        'table.table-selector',
        'table.highlightColumn',
        'table.column-resizing',
        'table.column-visibility',
        'table.column-fixed'
    ]);
    
})(angular);