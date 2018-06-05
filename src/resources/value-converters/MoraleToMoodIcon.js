export class MoraleToMoodIconValueConverter {
	toView( value ) {
		value = Math.round( value * 10 ); // make integers
		switch ( value ) { 
			case 10: 
			case 9: return '/cc/x/img/icons/moods/moods1.png';
			case 8: return '/cc/x/img/icons/moods/moods2.png';
			case 7: return '/cc/x/img/icons/moods/moods3.png';
			case 6: return '/cc/x/img/icons/moods/moods4.png';
			case 5: return '/cc/x/img/icons/moods/moods5.png';
			case 4: return '/cc/x/img/icons/moods/moods6.png';
			case 3: return '/cc/x/img/icons/moods/moods7.png';
			case 2: return '/cc/x/img/icons/moods/moods8.png';
			default: return '/cc/x/img/icons/moods/moods9.png';
			};
		}
	}
