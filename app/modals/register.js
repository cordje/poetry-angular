app.controller( 'modals/register', function ( $scope, $http, $location, ngDialog, $window ) {

    $scope.register = {};

    $scope.createUser = function createUser() {

        console.info( 'Try to register', $scope.register.email );

        $http.post( '/api/teams', {

                email: $scope.register.email,
                language : $scope.register.language,
                firstName : $scope.register.firstName,
                lastName : $scope.register.lastName,
                phone : $scope.register.phone,
                teamName : $scope.register.teamName

            } )
            .then( function success( response ) {
                console.log(response);

                $window.location.replace( $location.absUrl() );

            }, function error( response ) {
                switch (response.status) {
                    case 406:
                        console.info("Adresse mail déjà utilisée");
                        break;

                    default:
                        console.info(response.status);
                }
                console.log(response);
                $scope.failed = true;

            } );
    },

    $scope.closeModal = function closeModal() {

        $window.location.replace( $location.absUrl() );
    }

} );
