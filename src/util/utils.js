
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
	return this;
	}
	
Array.prototype.pickRandom = function() {
	if ( this.length == 0 ) { return false; }
	return this[ Math.floor( (Math.random() * (this.length) ) ) ];
	}
	
Array.prototype.contains = function( obj ) {
	return this.indexOf( obj ) > -1;
	}
	
Array.prototype.sum = function() {
	let total = 0;
	for ( let i of this ) { total += i; }
	return total;
	}
	
Array.prototype.avg = function() {
	return this.length ? ( this.sum() / this.length ) : 0;
	}

export function Clamp( n, min, max ) { 
	return Math.min(Math.max(n, min), max);
	}
	
export function RandomFloat( min, max ) { 
	min = Number.parseFloat(min);
	max = Number.parseFloat(max);
	return (Math.random() * ((max+1)-min) ) + min;
	}
export function RandomInt( min, max ) { 
	min = Number.parseInt(min);
	max = Number.parseInt(max);
	return Math.floor( (Math.random() * ((max+1)-min) ) + min );
	}
	
// http://stackoverflow.com/questions/29325069/how-to-generate-random-numbers-biased-towards-one-value-in-a-range
export function BiasedRand(min, max, bias, influence /* 0.0..1.0 */) {
	let rnd = Math.random() * (max - min) + min;   // random in range
	let mix = Math.random() * influence;           // random mixer - higher influence number means more spread
	return rnd * (1 - mix) + bias * mix;           // mix full range and bias
	}
export function BiasedRandInt(min, max, bias, influence) {
	return Math.floor( BiasedRand(min, max+0.99999, bias, influence) );
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

// box = {x1,x2,y1,y2}
export function BoxIntersect( a, b ) {
	return !( a.x1 >= b.x2 || b.x1 >= a.x2 || a.y1 >= b.y2 || b.y1 >= a.y2 );
	}
	
// box = {x1,x2,y1,y2}
export function BoxPointIntersect( b, px, py ) {
	return px >= b.x1 && px <= b.x2 && py >= b.y1 && py <= b.y2;
	}

export function DistanceBetween( x1, y1, x2, y2, fastcalc = false ) {
	let dist = 
		( (x2 - x1) * (x2 - x1) ) +
		( (y2 - y1) * (y2 - y1) ) ;
	return fastcalc ? dist : Math.sqrt(dist); 
	}
	
// maps a number from one range to a number from a different range
export function MapToRange( n, min1, max1, min2, max2 ) { 
  return ( (n - min1) * ( (max2 - min2) / (max1 - min1) ) ) + min2;
  }

export function DecToHex( n ) { 
	n = n.toString(16);
	if ( n.length % 2 ) { n = '0' + n; }
	return n;
	}
	
export function HexToDec( n ) { 
	return parseInt(n, 16);
	}

// DJB2 hash - https://gist.github.com/eplawless/52813b1d8ad9af510d85
export function hash(str) {
// 	let len = str.length;
// 	let hash = 5381;
// 	for ( var idx = 0; idx < len; ++idx ) {
// 		hash = 33 * hash + str.charCodeAt(idx);
// 		}
// 	return hash;function hash(str) {
	let hash = 5381;
	let i = str.length;
	while( i ) {
		hash = (hash * 33) ^ str.charCodeAt(--i);
		}
	/* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
	* integers. Since we want the results to be always positive, convert the
	* signed int to an unsigned by doing an unsigned bitshift. */
	return hash >>> 0;
	}
