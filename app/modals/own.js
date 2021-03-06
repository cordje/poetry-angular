app.controller( 'modals/own', function ( $scope, $http, $window, $location ) {

    $scope.own = function own(){
        $http.post( $scope.$root.__module.api + '/' + $scope.item._id, {} )
            .then( function success( response ) {

                console.info( 'own success', response );
                $window.location.replace( $location.absUrl() );

            }, function error( response ) {

                console.warn( 'own failed', response );
                $scope.failed = response.data.message;
                // $window.location.replace( $location.absUrl() );

            } );
    }

} );
