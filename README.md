angular-route-segment [![Build Status](https://secure.travis-ci.org/artch/angular-route-segment.png?branch=master)](https://travis-ci.org/artch/angular-route-segment)
=====================

A lightweight extension for [AngularJS](http://angularjs.org/) [$route](http://docs.angularjs.org/api/ngRoute.$route) service which supports tree-like nested views and routes hierarchy, and advanced loading flow handling.

Getting Started
-------

Example site is located here: 

> [**DEMO SITE**](http://angular-route-segment.com/src/example/)

The sources of this example can be found in the folder [/example](https://github.com/artch/angular-route-segment/tree/master/example).

You can install the library via [Bower](http://bower.io/):
```
bower install angular-route-segment
```
Or using [npm](http://npmjs.com):
```
npm install angular-route-segment
```
Or using this CDN link (thanks to [cdnjs.com](http://cdnjs.com)):
```html
<script src="//cdnjs.cloudflare.com/ajax/libs/angular-route-segment/1.5.0/angular-route-segment.min.js"></script>
```


Tested with AngularJS 1.2.21, 1.3.16, and 1.4.0.

Overview
--------

This library is intended to provide the lacking functionality of nested routing to AngularJS applications. It is widely known, there are no ways to keep the parent state unchanged when children are updated via routing mechanics - the `$route` service re-creates the whole scope after a route is changed, losing its state completely. **route-segment** gives you a way to handle this.

The library provides two pieces of code: `$routeSegment` service and `app-view-segment` directive. Both are placed in their own modules which you must include as dependencies in your app module:

```javascript
var app = angular.module('app', ['ngRoute', 'route-segment', 'view-segment']);
```

`$routeSegment` is a layer on top of built-in Angular `$route` service and is meant to be used instead of it. Its provider exposes configuration methods which can be used to traverse the tree of route segments and setup it properly.

```javascript

app.config(function ($routeSegmentProvider) {

$routeSegmentProvider.

    when('/section1',          's1').
    when('/section1/prefs',    's1.prefs').
    when('/section1/:id',      's1.itemInfo').
    when('/section1/:id/edit', 's1.itemInfo.edit').
    when('/section2',          's2').

    segment('s1', {
        templateUrl: 'templates/section1.html',
        controller: MainCtrl}).

    within().

        segment('home', {
            default: true,
            templateUrl: 'templates/section1/home.html'}).

        segment('itemInfo', {
            templateUrl: 'templates/section1/item.html',
            controller: Section1ItemCtrl,
            dependencies: ['id']}).

        within().
	    
            segment('overview', {
                default: true
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

Alternatively, you can use this syntax instead of traversing (useful if you want modules to have their own separately defined routes):

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
    
$routeSegmentProvider.within('s1').within('itemInfo').segment('overview', {
    templateUrl: 'templates/section1/item/overview.html'});
```

Then, any `app-view-segment` tags (which are similar to built-in `ng-view`) in the DOM will be populated with the corresponding route segment item. You must provide a segment index as an argument to this directive to make it aware about which segment level in the tree it should be linked to.

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

...etc. You can reach any nesting level here. Every view will be handled independently, keeping the state of top-level views.

You can also use filters to define link hrefs. It will resolve segment URLs automatically:
```html
<ul>
    <li ng-class="{active: ('s1' | routeSegmentStartsWith)}">
        <a href="{{ 's1' | routeSegmentUrl }}">Section 1</a>
    </li>
    <li ng-class="{active: ('s2' | routeSegmentStartsWith)}">
        <a href="{{ 's2' | routeSegmentUrl }}">Section 2</a>
    </li>
</ul>
```

Difference from UI-Router
-------------------------

While it seems that this library has very similar goal to what [UI-Router](https://github.com/angular-ui/ui-router/) provides, there are some important differences between their implementations, though.

*UI-Router* implements its own URL routing mechanics with its own "state" concept on top of it. *angular-route-segment* doesn't try to replace something in AngularJS. It is based on built-in `$route` engine, so that it tries to extend it rather than to replace. `$routeSegmentProvider.when` method is just a shorthand to `$routeProvider.when` with the simplified syntax. Inner segment-handling logic is built on top of events propagated by `$route` service, with internal usage of some route params from it.

Such approach makes it possible to accomplish the desired nested routing task in more simpler manner, which produces less code, less complexity and potential bugs, provides better cohesion with Angular core engine and is easier to understand, use and debug.

Documentation
-------------

Please note that you may read the [test specs](https://github.com/artch/angular-route-segment/tree/master/test/unit) to learn features usage.

### $routeSegmentProvider properties ###

##### options

A hash object which can be used to set up the service on config stage:

- *options.autoLoadTemplates*

    When true, it will resolve `templateUrl` automatically via $http service and put its contents into `template`.
    
- *options.strictMode* 

    When true, all attempts to call `within` method on non-existing segments will throw an error (you would usually want this behavior in production). When false, it will transparently create new empty segment (can be useful in isolated tests).

##### when(path, name, route)

The shorthand for `$routeProvider.when()` method with specified fully qualified route name.

- *path*

    Route URL, e.g. `/foo/bar`
    
- *name*
    
    Fully qualified route name, e.g. `foo.bar`
    
- *route*

    Mapping information object to be assigned to `$route.current` on route match.

##### segment(name, params)

Adds new segment at current pointer level.

- *name*

    Name of a segment item, e.g. `bar`
    
- *params*

    Segment's parameters hash. The following params are supported:
    
    - `template` provides HTML for the given segment view; if `template` is a function, it will be called with injectable arguments;
    - `templateUrl` is a template which should be fetched from the network via this URL; if `templateUrl` is a function, it will be called with injectable arguments; if neither `template` nor `templateUrl` parameters are defined, the DOM element's transcluded content will be used;
    - `controller` is attached to the given segment view when compiled and linked, this can be any controller definition AngularJS supports;
    - `controllerAs` is a controller alias name, if present the controller will be published to scope under the
    controllerAs name;
    - `dependencies` is an array of route param names which are forcing the view to recreate when changed;
    - `watcher` is a $watch-function for recreating the view when its returning value is changed;
    - `resolve` is a hash of functions or injectable names which should be resolved prior to instantiating the template and the controller;
    - `untilResolved` is the alternate set of params (e.g. `template` and `controller`) which should be used before resolving is completed; 
    - `resolveFailed` is the alternate set of params which should be used if resolving failed;
    - `default` is a boolean value which can be set to true if this child segment should be loaded by default when no child is specified in the route.
    
##### within(childName)

Traverses into an existing segment, so that subsequent `segment` calls will add new segments as its descendants.
             
- *childName* 

    An existing segment's name. An optional argument. If undefined, then the last added segment is selected.
    
##### up()
 
Traverses up in the tree.

##### root()
 
Traverses to the root.
 
### $routeSegment properties ###
 
##### name

Fully qualified name of current active route.

##### $routeParams

A copy of `$routeParams` in its state of the latest successful segment update. It may be not equal to `$routeParams`
while some resolving is not completed yet. Should be used instead of original `$routeParams` in most cases.

##### chain

An array of segments splitted by each level separately. Each item contains the following properties:

- `name` is the name of a segment;
- `params` is the config params hash of a segment;
- `locals` is a hash which contains resolve results if any;
- `reload` is a function to reload a segment (restart resolving, reinstantiate a controller, etc)

##### startsWith(val)

Helper method for checking whether current route starts with the given string.

##### contains(val)

Helper method for checking whether current route contains the given string.

##### getSegmentUrl(segmentName, routeParams)

A method for reverse routing which can return the route URL for the specified segment name.

- *segmentName*

    The name of a segment as defined in `when()`.

- *routeParams*

    Route params hash to be put into route URL template. Standard `$routeParams` object is used first;
    it is extended (overrided) with this provided object then.

```javascript
$routeSegment.getSegmentUrl('s1');                              // -> '/section1'
$routeSegment.getSegmentUrl('s1.prefs');                        // -> '/section1/prefs'
$routeSegment.getSegmentUrl('s1.itemInfo', {id: 123});          // -> '/section1/123'
$routeSegment.getSegmentUrl('s1.itemInfo.edit', {id: 123});     // -> '/section1/123/edit'
```

### Filters ###

**ATTENTION:** filters are not stateless. While they are not intended to work with complex data structures, it can impact performance anyway. See more info at [angular.js commit fca6be71](https://github.com/angular/angular.js/commit/fca6be71).

##### routeSegmentEqualsTo

A wrapper for `$routeSegment.name == value`.
```html
<li ng-class="{active: ('s1' | routeSegmentEqualsTo)}">
```

##### routeSegmentStartsWith

A wrapper for `$routeSegment.startsWith(value)`.
```html
<li ng-class="{active: ('s1' | routeSegmentStartsWith)}">
```

##### routeSegmentContains

A wrapper for `$routeSegment.contains(value)`.
```html
<li ng-class="{active: ('s1' | routeSegmentContains)}">
```

##### routeSegmentParam

A wrapper for `$routeSegment.$routeParams[value]`.
```html
<li ng-class="{active: ('s1.itemInfo' | routeSegmentEqualsTo) && ('id' | routeSegmentParam) == 123}">
```

##### routeSegmentUrl

A wrapper for `$routeSegment.getSegmentUrl`.
```html
<a ng-href="{{ 's1.home' | routeSegmentUrl }}">
<a ng-href="{{ 's1.itemInfo.edit' | routeSegmentUrl: {id: 123} }}">
```

License
-------

The MIT License (MIT)

Copyright (c) 2013 Artem Chivchalov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
