app.filter( 'localize', function ( $filter, $rootScope ) {

    function localize( input ) {

        if ( input === undefined ) return undefined;
        if ( input === null ) return $filter( 'translate' )( 'null:value' );
        if ( input === false ) return $filter( 'translate' )( 'false:value' );
        if ( input === true ) return $filter( 'translate' )( 'true:value' );

        if ( isFinite( input ) ) {
            input = parseFloat( input );
            if ( input > 0xe8d4a51000 && input < 0x82f79cd9000 )
                return _date( input );

            return _number( input );
        }

        if ( input.length == 24 || input instanceof Date )
            if ( _date( input ) != "Invalid Date" ) return _date( input );

        if ( typeof input == 'object' ) {
            if ( input.name ) return input.name;
            if ( input.id ) return input.id;
            if ( input._id ) return input._id;

            var output = '';
            Object.keys( input )
                .forEach( function ( key ) {
                    output += $filter( 'translate' )( key + ':subvalue' );
                    output += ': ' + localize( input[ key ] ) + '\n';
                } );
            return output;
        }

        return input;

    };

    function _date( input ) {
        var output = new Date( input );
        if ( output.getFullYear() == 1970 )
            output = new Date( output.getTime() * 1000 );
        return output.toLocaleString( $rootScope.user.locale || undefined );
    }

    function _number( input ) {
        return input.toLocaleString( $rootScope.user.locale || undefined );
    }

    return localize;

} );
