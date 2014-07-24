'use strict';
describe('Tests related to the Global Functions', function () {

    describe('RepeaterUtilities', function () {

        it('With filter on standard ng-repeat with |', function () {
            var s = "item in list| filter filterText";
            var elm = "<table><tbody><tr ng-repeat=\"" + s + "\"></tr><tr></tr></tbody></table>";
            var list = RepeaterUtilities.extractCollection(elm);
            expect(list).toEqual("list");
        });
        
        it('Standard ng-repeat with <space>', function () {
            var s = "item in list track by $index";
            var elm = "<table><tbody><tr ng-repeat=\"" + s + "\"></tr></tbody></table>";
            var list = RepeaterUtilities.extractCollection(elm);
            expect(list).toEqual("list");
        });
        
        it('Standard ng-repeat with data- prefix', function () {
            var s = "item in list track by $index";
            var elm = "<table><tbody><tr data-ng-repeat=\"" + s + "\"></tr></tbody></table>";
            var list = RepeaterUtilities.extractCollection(elm);
            expect(list).toEqual("list");
        });
        
        it('No table rows but is in comment', function () {
            var elm = "<table><tbody><!-- ngRepeat: c in list | filter:model.filter.text | limitTo: page.pageSize track by $index --></tbody></table>";
            var list = RepeaterUtilities.extractCollection(elm);
            expect(list).toEqual("list");
        });
    });
});