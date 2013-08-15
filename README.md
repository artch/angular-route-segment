angular-route-segment
=====================

A feature-packed routing library for [AngularJS](http://angularjs.org/) which supports tree-like nested views and routes hierarchy, and advanced loading flow handling.

Getting Started
-------

Example site is located here: http://artch.ru/angular-route-segment/example/.

The sources of this example can be found in the folder '[example](https://github.com/artch/angular-route-segment/tree/master/example)'.

You can install the library via [Bower](http://bower.io/):
```
bower install angular-route-segment
```

Overview
--------

This library is intended to provide the lacking functionality of nested routing to AngularJS applications. It is widely known, there are no ways to keep a controller instance alive when only part of it should be updated via routing mechanics - the `$route` service re-creates the whole scope after a route is changed, losing its state completely. **route-segment** gives you a way to handle this.

The library provides two pieces of code: `$routeSegment` service and `app-view-segment` directive.

`$routeSegment` is meant to be used instead of built-in Angular `$route` service. Its provider exposes configuration methods which can be used to traverse the tree of route segments and setup it properly:

```javascript
angular.module('app').config(function ($routeSegmentProvider) {

$routeSegmentProvider.

    when('/section1',          's1.home').
    when('/section1/prefs',    's1.prefs').
    when('/section1/:id',      's1.itemInfo.overview').
    when('/section1/:id/edit', 's1.itemInfo.edit').
    when('/section2',          's2').

    segment('s1', {
        templateUrl: 'templates/section1.html',
        controller: MainCtrl}).

    within().

        segment('home', {
            templateUrl: 'templates/section1/home.html'}).

        segment('itemInfo', {
            templateUrl: 'templates/section1/item.html',
            controller: Section1ItemCtrl,
            dependencies: ['id']}).

        within().
	    
            segment('overview', {
                templateUrl: 'templates/section1/item/overview.html'}).

            segment('edit', {
                 templateUrl: 'templates/section1/item/edit.html'}).

            up().

        segment('prefs', {
            templateUrl: 'templates/section1/prefs.html'}).

        up().

    segment('s2', {
        templateUrl: 'templates/section2.html',
        controller: MainCtrl});
```

Alternatively, you can use this syntax instead of traversing:

```javascript
$routeSegmentProvider.segment('s1', {
    templateUrl: 'templates/section1.html',
    controller: MainCtrl});

$routeSegmentProvider.within('s1').segment('home', {
    templateUrl: 'templates/section1/home.html'});

$routeSegmentProvider.within('s1').segment('itemInfo', {
    templateUrl: 'templates/section1/item.html',
    controller: Section1ItemCtrl,
    dependencies: ['id']});
```

Then, any `app-view-segment` tags (which are similar to built-in `ng-view`) in the DOM will be populated with the corresponding route segment item. You must provide a segment index as an argument to this directive to make it aware about which segment in the tree it should be linked to.

**index.html:**
```html
<ul>
    <li ng-class="{active: $routeSegment.startsWith('s1')}">
        <a href="/section1">Section 1</a>
    </li>
    <li ng-class="{active: $routeSegment.startsWith('s2')}">
        <a href="/section2">Section 2</a>
    </li>
</ul>
<div id="contents" app-view-segment="0"></div>
```

**section1.html:** (it will be loaded to `div#contents` in `index.html`)
```html
<h4>Section 1</h4>
Section 1 contents.
<div app-view-segment="1"></div>
```

...etc. You can reach any nesting level here.

Documentation
-------------

Please note that you may read the [test specs](https://github.com/artch/angular-route-segment/tree/master/test/unit) to learn features usage.

### $routeSegmentProvider ###

**options**

A hash object which can be used to set up the service on config stage:

- *options.autoLoadTemplates*

    When true, it will resolve `templateUrl` automatically via $http service and put its contents into `template`.
    
- *options.strictMode* 

    When true, all attempts to call `within` method on non-existing segments will throw an error (you would usually want this behavior in production). When false, it will transparently create new empty segment (can be useful in isolated tests).

**when(route, name)**

The shorthand for $routeProvider.when() method with specified fully qualified route name.

- *route*

    Route URL, e.g. `/foo/bar`
    
- *name*
    
    Fully qualified route name, e.g. `foo.bar`

**segment(name, params)**

Adds new segment at current pointer level.

- *name*

    Name of a segment item, e.g. `bar`
    
- *params*

    Segment's parameters hash. The following params are supported:
    
    - `template` provides HTML for the given segment view;
    - `templateUrl` is a template which should be fetched from the network via this URL;
    - `controller` is attached to the given segment view when compiled and linked, this can be any controller definition AngularJS supports;
    - `dependencies` is an array of route param names which are forcing the view to recreate when changed;
    - `watcher` is a $watch-function for recreating the view when its returning value is changed;
    - `resolve` is a hash of functions or injectable names which should be resolved prior to instantiating the template and the controller;
    - `untilResolved` is the alternate set of params (e.g. `template` and `controller`) which should be used before resolving is completed; 
    - `resolveFailed` is the alternate set of params which should be used if resolving failed.
    
**within(childName)**

Traverses into an existing segment, so that subsequent `segment` calls will add new segments as its descendants.
             
- *childName* 

    An existing segment's name. An optional argument. If undefined, then the last added segment is selected.
    
**up()**   
 
Traverses up in the tree.

**root()**   
 
Traverses to the root.
 
### $routeSegment ###
 
**name**

Fully qualified name of current active route.

**chain**

An array of segments splitted by each level separately. Each item contains the following properties:

- `name` is the name of a segment;
- `params` is the config params hash of a segment;
- `locals` is a hash which contains resolve results if any;
- `reload` is a function to reload a segment (restart resolving, reinstantiate a controller, etc)

**startsWith(val)**

Helper method for checking whether current route starts with the given string.

**contains(val)**

Helper method for checking whether current route contains the given string.


License
-------

The MIT License (MIT)

Copyright (c) 2013 Artem Chivchalov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
