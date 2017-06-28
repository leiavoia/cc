export class DifficultySettingValueConverter {
	toView( value ) {
		value = Math.round( value * 10 ); // make integers
		switch ( value ) { 
			case 0: return 'Brain-Dead';
			case 1: return 'Idiotic';
			case 2: return 'Cake Walk';
			case 3: return 'Hand-Holdy';
			case 4: return 'Easy';
			case 5: return 'Normal';
			case 6: return 'Obtuse';
			case 7: return 'Challenging';
			case 8: return 'Frustrating';
			case 9: return 'Crazy';
			case 10: return 'Hopeless';
			};
		}
	}
