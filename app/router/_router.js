app.component( 'appRouter', {
    templateUrl: 'router/_router.pug',
    controller: function ( $window, $http, $scope, $templateCache, $controller ) {

        $http.get( '/' + __appName + '/__sidebar.json' )
            .then( function onReceiveModulesList( r ) {
                var modules = {
                    'error':{
                        name:'error',
                        templateUrl: 'generic/error.pug',
                        hidden: true
                    },
                };

                r.data.forEach( function ( module ) {

                    if ( typeof module == 'string' )
                        module = {
                            name: module
                        }

                    if ( !module.name )
                        throw console.error( 'This module has no name', module );

                    if ( !module.icon )
                        module.icon = module.name;

                    if ( !module.templateUrl && !module.template ) {
                        if ( $templateCache.get( module.name + '/list.pug' ) )
                            module.templateUrl = module.name + '/list.pug'
                        else
                            module.templateUrl = 'generic/list.pug';
                    }

                    if ( !module.api )
                        module.api = '/api/' + module.name;

                    if ( !module.controller ) {
                        module.controller = 'generic/list';
                    }

                    if ( module.path === undefined )
                        module.path = module.name;

                    modules[ module.path ] = module;

                } );

                $scope.$root.__modules = modules;
                route( null, $window.location.pathname );

                $scope.$on( '$locationChangeStart', route );

            } );

        function route( ev, nextUrl, oldUrl, n ) {
            nextUrl = nextUrl.replace( '://', '' );
            var path = nextUrl.split( '/' )
                .slice( 2 );

            if ( !$scope.$root.__modules[ path[ 0 ] ] ) {
                console.warn( 'Unhandled route :', path );
                $scope.__module = undefined;
                $scope.__module.id = undefined;
                $scope.__module.view = undefined;
                return;
            }

            $scope.__module = $scope.$root.__modules[ path[ 0 ] ];
            $scope.__id = path[ 1 ];
            $scope.__view = path[ 2 ];
            console.info( 'Going to', $scope.__module.name, $scope.__id, $scope.__view );

            try {
                if($scope.__module.controller)
                    $scope.__module.ctrl = $controller( $scope.__module.controller, {
                        $scope: $scope
                    } );
            } catch ( err ) {
                console.error( err );
            }

        }
    }
} );