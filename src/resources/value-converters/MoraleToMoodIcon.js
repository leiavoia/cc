export class MoraleToMoodIconValueConverter {
	toView( value ) {
		if ( value > 1.50 ) { return 'img/icons/moods/moods1.png'; }
		if ( value > 1.25 ) { return 'img/icons/moods/moods2.png'; }
		if ( value > 1.1 ) { return 'img/icons/moods/moods3.png'; }
		if ( value > 0.9 ) { return 'img/icons/moods/moods4.png'; }
		if ( value > 0.8 ) { return 'img/icons/moods/moods5.png'; }
		if ( value > 0.7 ) { return 'img/icons/moods/moods6.png'; }
		if ( value > 0.6 ) { return 'img/icons/moods/moods7.png'; }
		if ( value > 0.5 ) { return 'img/icons/moods/moods8.png'; }
		return 'img/icons/moods/moods9.png';
		}
	}
