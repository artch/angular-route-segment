basePath = './';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'test/lib/jquery.min.js',
  'test/lib/angular.js',
  'test/lib/angular-mocks.js',  
  'test/lib/**/*.js',
  'src/**/*.js',
  'test/unit/**/*.js',
];

autoWatch = true;

browsers = ['PhantomJS'];
