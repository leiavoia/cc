export class MinMaxValueConverter {
	toView( value ) {
		value = Math.round( value * 10 ); // make integers
		if ( value == 0 ) { return "None"; }
		else if ( value == 10 ) { return "Maximum"; }
		return value;
		}
	}
