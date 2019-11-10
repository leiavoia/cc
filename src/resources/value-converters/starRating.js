export class starRatingValueConverter {
	toView( value, max = 5, ch1 ='★', ch2 = '☆', word_when_empty = '' ) {
		value = Math.ceil( value * max );
		let str = ch1.repeat(value);
		str += ch2.repeat( max - value );
		if ( !value && word_when_empty ) { return word_when_empty; }
		return str;
		}
	}
