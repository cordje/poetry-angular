app.controller( 'modals/own', function ( $scope, $http ) {

    $scope.own = function own(){
        $http.post( $scope.module.api + '/' + $scope.item.id, {} )
            .then( function success( response ) {

                console.info( 'own success', response );
                $window.location.replace( $location.absUrl() );

            }, function error( response ) {

                console.warn( 'own failed', response );
                $scope.failedAdd = response.data.message;
                // $window.location.replace( $location.absUrl() );

            } );
    }

} );
