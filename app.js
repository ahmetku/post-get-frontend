'use strict';

var myApp;
myApp = angular

    .module("myApp", ['ui.router'])

    .constant("BASEURL", "http://localhost:3000")

    .service('auth', function authService($window) {

        var self = this;
        this.token;

        this.isAuthed = isAuthed;
        this.parseJwt = parseJwt;
        this.saveToken = saveToken;
        this.getToken = getToken;
        this.deleteToken = deleteToken;

        function saveToken(t) {
            $window.localStorage['jwtToken'] = t;
        }

        function getToken() {
            return $window.localStorage['jwtToken'];
        }

        function deleteToken() {
            $window.localStorage.removeItem('jwtToken');
        }

        function parseJwt(token) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace('-', '+').replace('_', '/');
            return JSON.parse($window.atob(base64));
        }

        function isAuthed() {

            var token = self.getToken();
            return !!token;
        }
    })


    .factory("authInterceptor", function authInterceptor(BASEURL, auth) {

        function req(config) {
            // automatically attach Authorization header
            if (config.url.indexOf(BASEURL) === 0 && auth.isAuthed()) {
                var token = auth.getToken();
                config.headers.Authorization = 'JWT ' + token;
            }
            return config;
        }

        function res(res) {
            // If a token was sent back, save it
            if (res && res.config.url.indexOf(BASEURL) === 0 && res.data.token) {
                auth.saveToken(res.data.token);
            }
            return res;
        }

        return {
            request: req,
            response: res
        };
    })


    .service('currUser', function currUserService(BASEURL, $http, auth) {

        this.register = register;
        this.login = login;
        this.loggedIn = auth.isAuthed;
        this.logout = auth.deleteToken;
        this.getUser = getUser;

        ////////////////

        function register(user, pass) {
            return $http.post(BASEURL + '/signup', {
                username: user,
                password: pass
            });
        }

        function login(user, pass) {
            return $http.post(BASEURL + '/login', {
                username: user,
                password: pass
            });
        }

        function getUser() {
            var token = auth.getToken();
            return token ? auth.parseJwt(token).user : {};
        }
    })

    .config(function ($httpProvider) {

        $httpProvider.interceptors.push('authInterceptor');

    })

    .controller("register", ["$scope", "currUser", function ($scope, currUser) {
        $scope.username = '';
        $scope.pwd = '';
       // $scope.pwdConfirm
        $scope.errorText = '';

        $scope.register = register;
       // $scope.cancel = cancel;

        function register() {
            currUser.register($scope.username, $scope.pwd).then(function () {
         //       $mdDialog.hide();
            }, function (response) {
                debugger;
                if (response.status == 400 || response.status == 401) {
                    $scope.errorText = "An unknown error occured. please try again later.";
                }
            });
        }

   //     function cancel() {
   //         $mdDialog.cancel();
   //     }
    }])


    .controller("login", ["$scope", "currUser", function ($scope, currUser) {
        $scope.username = '';
        $scope.pwd = '';
        $scope.errorText = '';

        $scope.login = login;
     //   $scope.cancel = cancel;

        function login() {
            currUser.login($scope.username, $scope.pwd).then(function () {

            }, function (response) {
                if (response.status == 400 || response.status == 401) {
                    $scope.errorText = "Wrong username or password.";
                } else {
                    $scope.errorText = "An unknown error occured. please try again later.";
                }
            });
        }

    //    function cancel() {
    //        $mdDialog.cancel();
    //    }
    }])

    .directive('daycycleToolbar', function() {
        return {
            restrict: "A",
            templateUrl: "components/toolbar/toolbar.html",
            controller: ["$scope", "currUser", "$mdDialog", "$mdMedia", "$mdToast", function($scope, currUser, $mdDialog, $mdMedia, $mdToast) {

                $scope.user = null;


                $scope.showLoginDialog = showLoginDialog;
                $scope.showSignupDialog = showSignupDialog;
                $scope.logout = logout;

                $scope.$watch(function(){
                    return currUser.loggedIn();
                }, function(loggedIn){
                    $scope.loggedIn = loggedIn;
                    if (loggedIn && !$scope.user) {
                        $scope.user = currUser.getUser();
                    }
                });



                /////////////////////

                function showLoginDialog(){
                    var useFullScreen = $mdMedia('xs');
                    $mdDialog.show({
                        controller: 'login',
                        templateUrl: 'components/login-dialog/login-dialog.html',
                        clickOutsideToClose:true,
                        fullscreen: useFullScreen
                    });
                };
                function showSignupDialog(){
                    var useFullScreen = $mdMedia('xs');
                    $mdDialog.show({
                        controller: 'register',
                        templateUrl: 'components/register-dialog/register-dialog.html',
                        clickOutsideToClose:true,
                        fullscreen: useFullScreen
                    });
                };

                function logout(){
                    currUser.logout();
                }

                function showSimpleToast(txt){
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent(txt)
                            .position('bottom right')
                            .hideDelay(3000)

                    );
                }
            }]
        }
    });


/*

 .config(function ($stateProvider, $urlRouterProvider) {

 // For any unmatched url, redirect to /movies
 $urlRouterProvider.otherwise("/movies");

 $stateProvider.state('root', {
 abstract: true,
 templateUrl: "views/root/root.html"
 });
 })


 */

