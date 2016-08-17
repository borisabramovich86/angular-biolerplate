angular.module('templates', []);

angular.module(
    'mainApp', [
        'mainApp.controllers',
        'mainApp.services',
        'templates',
        'component'
    ])
    .run([
        '$rootScope',
        function ($rootScope) {
        }
    ]);