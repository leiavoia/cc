export class AnnoyometerValueConverter {
	toView( value ) {
		value = Math.round( value * 10 ); // make integers
		switch ( value ) { 
			case 0: return 'Angry';
			case 1: return 'Frustrated';
			case 2: return 'Annoyed';
			case 3: return 'Bothered';
			case 4: return 'Disinterested';
			case 5: return 'Passive';
			case 6: return 'Listening';
			case 7: return 'Interested';
			case 8: return 'Keen';
			case 9: return 'Enthusiastic';
			case 10: return 'Entertained';
			};
		}
	}
