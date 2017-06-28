export class GalaxyAgeValueConverter {
	toView( value ) {
		value = Math.round( value * 10 ); // make integers
		switch ( value ) { 
			case 0: return 'Newborn';
			case 1: return 'Infantile';
			case 2: return 'Young';
			case 3: return 'Adolescent';
			case 4: return 'Developed';
			case 5: return 'Balanced';
			case 6: return 'Mature';
			case 7: return 'Senior';
			case 8: return 'Old';
			case 9: return 'Ancient';
			case 10: return 'Dead';
			};
		}
	}
