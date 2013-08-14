angular-route-segment
=====================

A feature-packed routing library for [AngularJS](http://angularjs.org/) which supports tree-like nested routes and handling the  loading flow.

Example
-------

Example site is located here: http://artch.ru/angular-route-segment/example/.
You can find the sources of this example in the folder '[example](https://github.com/artch/angular-route-segment/tree/master/example)'.

Overview
--------

This library is intended to provide the lacking functionality of nested routing to AngularJS applications. It is widely known there are no ways to keep a controller instance alive when only part of it should be updated via routing mechanics -- the `$route` service is re-creating the whole scope after a route is changed. `angular-route-segment` library gives you a way to handle this.

The library provides two pieces of code: `$routeSegment` service and `app-view-segment` directive.

`$routeSegment` is meant to be used instead of built-in Angular `$route` service. Its provider exposes configuration methods which can be used to traverse the tree of route segments and setup it properly:

```javascript
angular.module('app').config(function ($routeSegmentProvider) {

$routeSegmentProvider.
    when('/section1',          's1.home').
    when('/section1/prefs',    's1.prefs').
    when('/section1/:id',      's1.itemInfo.overview').
    when('/section1/:id/edit',    's1.itemInfo.edit').
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

		segment('tab2', {
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

Then, any `app-view-segment` tags in the DOM will be populated with the corresponding route segment item. You must provide a segment index as an argument to this directive to make it aware about which segment in the tree it should be linked to.

**index.html:**
```html
<ul>
    <li><a href="/section1">Section 1</a></li>
    <li><a href="/section2">Section 2</a></li>
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

**$routeSegmentProvider.options**

A hash object which can be used to set up the service on config stage:

- *options.autoLoadTemplates*

    When true, it will resolve `templateUrl` automatically via $http service and put its contents into `template`.
    
- *options.strictMode* 

    When true, all attempts to call `within` method on non-existing segments will throw an error (you would usually want this behavior in production). When false, it will transparently create new empty segment (can be useful in isolated tests).

**$routeSegmentProvider.when(route, name)**

The shorthand for $routeProvider.when() method with specified fully qualified route name.

- *route*

    Route URL, e.g. `/foo/bar`
    
- *name*
    
    Fully qualified route name, e.g. `foo.bar`

**$routeSegmentProvider.segment(name, params)**

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
    
**$routeSegmentProvider.within(childName)**

Traverses into an existing segment, so that subsequent `segment` calls will add new segments as its descendants.
             
- *childName* 

    An existing segment's name. An optional argument. If undefined, then the last added segment is selected.
    
**$routeSegmentProvider.up()**   
 
 Traverses up in the tree.

**$routeSegmentProvider.root()**   
 
Traverses to the root.
 
## $routeSegment ##
 
**$routeSegment.name**

Fully qualified name of current active route.

**$routeSegment.chain**

An array of segments splitted by each level separately. Each item contains the following properties:

- `name` is the name of a segment;
- `params` is the config params hash of a segment;
- `locals` is a hash which contains resolve results if any;
- `reload` is a function to reload a segment (restart resolving, reinstantiate a controller, etc)

**$routeSegment.startsWith(val)**

Helper method for checking whether current route starts with the given string.

**$routeSegment.contains(val)**

Helper method for checking whether current route contains the given string.