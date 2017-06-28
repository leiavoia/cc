export class StarDensityValueConverter {
	toView( value ) {
		value = Math.round( value * 10 ); // make integers
		switch ( value ) { 
			case 0: return 'Ultra Rare';
			case 1: return 'Very Rare';
			case 2: return 'Rare';
			case 3: return 'Unusual';
			case 4: return 'Uncommon';
			case 5: return 'Common';
			case 6: return 'Very Common';
			case 7: return 'Plentiful';
			case 8: return 'Lots';
			case 9: return 'Tons';
			case 10: return 'Stuffed';
			};
		}
	}
