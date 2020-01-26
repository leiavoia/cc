export class LoveNubValueConverter {
	toView( value ) {
		value = Math.ceil( value * 10 ); // make integers
		switch ( value ) { 
			case 0: return 'Hostile';
			case 1: return 'Enmity';
			case 2: return 'Bitter';
			case 3: return 'Unfriendly';
			case 4: return 'Cool';
			case 5: return 'Indifferent';
			case 6: return 'Neighborly';
			case 7: return 'Warm';
			case 8: return 'Friendly';
			case 9: return 'Peaceful';
			case 10: return 'Harmony';
			};
		}
	}
