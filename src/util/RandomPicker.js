export default class RandomPicker {
	
	items;
	
	// arr = weights, e.g.:
	// [ ['foo',5], ['bar',9], ['joo',20] ]
	constructor( arr ) {
		let sum = 0;
		let i = 0;
		let l = 0;
		// find sum of all weights and accumulate the new values
		for ( i = 0, l=arr.length; i < l; i++ ) {
			sum += arr[i][1];
			arr[i][1] = sum;
			}
		// find the normalized values for each weight
		for ( i = 0, l=arr.length; i < l; i++ ) {
			arr[i][1] /= sum;
			}
		// save array
		this.items = arr;
		}

	Pick() {
		let needle = Math.random();
		let high = this.items.length - 1;
		let low = 0;
		let probe = 0;
		
		if ( this.items.length == 0 ) { return null; }
		if ( this.items.length == 1 ) { return this.items[0]; }
		
		while ( low < high ) {
			probe = Math.ceil( (high+low)/2 );
			if ( this.items[probe][1] < needle ) {
				low = probe + 1;
				}
			else if ( this.items[probe][1] > needle ) {
				high = probe - 1;
				}
			else {
				return this.items[probe][0]; // nailed it
				}
			}
		
		if ( low != high ) {
			return ( this.items[low][1] >= needle ) ? this.items[low][0] : this.items[probe][0];
			}
		else {
			return ( this.items[low][1] >= needle ) ? this.items[low][0] : this.items[low+1][0];
			}
		}
	
	}
