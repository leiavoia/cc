
String.prototype.uppercaseFirst = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
	};
	


Number.prototype.clamp = function(min, max) {
	return Math.min(Math.max(this, min), max);
	};

Array.prototype.unique = function() {
	let n = {},r=[];
	for(var i = 0; i < this.length; i++) {
		if (!n[this[i]]) {
			n[this[i]] = true; 
			r.push(this[i]); 
			}
		}
	return r;
	}
Array.prototype.shuffle = function() {
	for (let i = this.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		let temp = this[i];
		this[i] = this[j];
		this[j] = temp;
		}
	}
	
Array.prototype.pickRandom = function() {
	if ( this.length == 0 ) { return false; }
	return this[ Math.floor( (Math.random() * (this.length+1) ) ) ];
	}

export function Clamp( min, max ) { 
	return Math.min(Math.max(this, min), max);
	}
	
export function RandomFloat( min, max ) { 
	return (Math.random() * ((max+1)-min) ) + min;
	}
export function RandomInt( min, max ) { 
	return Math.floor( (Math.random() * ((max+1)-min) ) + min );
	}
	
// http://stackoverflow.com/questions/29325069/how-to-generate-random-numbers-biased-towards-one-value-in-a-range
export function BiasedRand(min, max, bias, influence) {
	let rnd = Math.random() * (max - min) + min;   // random in range
	let mix = Math.random() * influence;           // random mixer
	return rnd * (1 - mix) + bias * mix;           // mix full range and bias
	}
export function BiasedRandInt(min, max, bias, influence) {
	return Math.round( BiasedRand(min, max, bias, influence) );
	}

export function standardRandom() {
// 	return (1.0 + (((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3.0) / 3.0)) * 0.5;
// 	return (1.0 + (((Math.random() + Math.random() + Math.random() + Math.random()) - 2) / 2)) * 0.5;
	return (1.0 + (((Math.random() + Math.random() + Math.random() ) - 1.5) / 1.5)) * 0.5;
	}

export function Romanize( n ) { 
	switch ( n ) {
		case 10: return 'X';
		case 9: return 'IX';
		case 8: return 'VIII';
		case 7: return 'VII';
		case 6: return 'VI';
		case 5: return 'V';
		case 4: return 'IV';
		case 3: return 'III';
		case 2: return 'II';
		case 1: return 'I';
		default: return 'XXX';
		}
	}	