__Note: Please wait until the 1.0 milestone release for using in any projects.  APIs (including directives) are subject to change until this release is finalized.__


# ng-scrolling-table
## An Angular Scrolling Table using HTML Tags

__Bower Install:__
The library is now available in Bower and can be accessed running
> bower install ng-scrolling-table --save

__Example:__
* [Live Example] (http://ng-scrolling-table.drakeserver.com/ng-scrolling-table%20live%20demo/examples/)

__Required libraries:__

Currently the ng-scrolling-table library only requires the following 3rd-party libraries:
* jquery 1.9.x or higher (does work with jquery 2.x)
* angular 1.2.x or higher (currently tested with angular 1.3.x) - currently no 1.3 features are used but this may change

__Recommended libraries:__

These libraries are not required but may be desired to take full advantage of the library:
* [jquery-resize-plugin] (http://benalman.com/projects/jquery-resize-plugin/) without this plugin, the table scroller will not resize automatically upon the table content height changing.  Only an issue if your table height adjusts based on the content of the container (for example the container has a table plus a collapsing panel.  When the panel is expanded it will change the available height for the table) 

__Tests:__

To contribute to the project it is preferred that changes or enhancements have accompanying tests.  To run the tests, you will require:
* nodejs (npm)
* git
* bower (run npm install -g bower)

To execute the tests run
> npm test

If you have growl installed you will get test notification changes.  The test target on npm will automatically call bower to install any tests dependencies needed.  By default, all tests dependencies are marked as optional since the continuous build environment is not executing the tests. 

__Build status:__
* [![Build Status](http://drake-server.ddns.net:9000/jenkins/buildStatus/icon?job=ng-scrolling-table)](http://drake-server.ddns.net:9000/jenkins/job/ng-scrolling-table/)

__Design thoughts:__
Notes on the design approach and thoughts are now being captured in the wiki document located [Here](https://github.com/jadrake75/ng-scrolling-table/wiki)

__Contributors:__

ng-scrolling-table Team:
* [Jason Drake](https://github.com/jadrake75)
* [Joseph Aseplund] (https://github.com/xanir)
* [Brien Coffield] (https://github.com/coffbr01)

__Additional Credits:__
* Fugue Icons by Yusaki Kamiyamane (http://p.yusukekamiyamane.com)
