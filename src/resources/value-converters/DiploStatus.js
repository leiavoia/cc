export class DiploStatusValueConverter {
	toView( v ) {
		switch ( v ) { 
			case -2: return 'At War';
			case -1: return 'Adversaries';
			case 0:  return 'Neutral'
			case 1:  return 'Friends';
			case 2:  return 'Allies';
			};
		}
	}
