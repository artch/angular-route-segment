# 1.3.2 (2014-09-19)

- Fixed a case when `watcher` is provided in annotated array form rather than as a function ([84602](https://github.com/artch/angular-route-segment/commit/84602f83fbb20d336f0fdc3d34a22d7834a6489b)).

# 1.3.1 (2014-08-12)

- Fixed a compatibility bug in IE8 ([0aaa2](https://github.com/artch/angular-route-segment/commit/0aaa25be27a8d0b7e36f2e07a9a303b9b3f3c3f5)) thanks to [jincod](https://github.com/jincod).

# 1.3.0 (2014-05-15)

## Features

- New function `$routeSegment.getSegmentUrl(segmentName, routeParams)` which can return URL for the given segment ([2b255](https://github.com/artch/angular-route-segment/commit/2b255db63b7273be9f0c75b19c464620835db9b9)).
- Some handy filters like `routeSegmentUrl`,`routeSegmentEqualsTo`, etc ([2b255](https://github.com/artch/angular-route-segment/commit/2b255db63b7273be9f0c75b19c464620835db9b9)).
- New segment config option `default:true` which can be set if this child segment should be loaded by default when no child segment is specified in the route ([2eee0](https://github.com/artch/angular-route-segment/commit/2eee0a1dc7d6a6ff031d8451c06d4da5ae7e50fc)).
- `template` and `templateUrl` can be set as injectable functions ([8d1ac](https://github.com/artch/angular-route-segment/commit/8d1ac0d1ea1aee9243f90e32e4e4387a717049ac)).

See updated [docs](https://github.com/artch/angular-route-segment/blob/master/README.md) and [demo example](http://angular-route-segment.com/src/example/) for usage.

## Bug fixes

- Fixed a bug when reloading a segment does not recover after the resolving error has gone ([ed11d](https://github.com/artch/angular-route-segment/commit/ed11d58e495ea7c611a59373fd6b909de1be33e3)).


# 1.2.4 (2014-05-08)

- Fixed a bug with null exception on `contains` function ([1b014](https://github.com/artch/angular-route-segment/commit/1b014d3b5ea7740815c7e0b98467bdff556e6a5b) thanks to [paivaric](https://github.com/paivaric)).

# 1.2.3 (2014-04-07)

- Fixed a bug with double updates of view segments ([eb0d8](https://github.com/artch/angular-route-segment/commit/eb0d8a0c4aa01c2d8ab600aacef69e4a5479afd6)).
- `options.autoLoadTemplates` is true by default ([afab3](https://github.com/artch/angular-route-segment/commit/afab3ae7b827b7141ebcf0b8130311dc5aac0d7d)).