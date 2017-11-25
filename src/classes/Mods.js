// import * as utils from '../util/utils';


	
export class Modlist {
	mods = [];
	parent = null;
	
	Add( mod ) {
		this.mods.push(mod);
		this.mods.sort( Modlist.SortMods );
		}
		
	Remove( ability, op, value ) { 
		let k = this.mods.length;
		while ( k-- ) { 
			let m = this.mods[k];
			if ( m.abil == ability && m.val == value && m.op == op ) {
				this.mods.splice( k, 1 );
				// do not break; there may be duplicates
				}
			}
		}
		
	// get a list of mods
	Query( ability, include_parent = true ) { 
		let mods = [];
		// if i have a parent modlist, query it also
		if ( this.parent && include_parent ) { 
			mods = this.parent.Query( ability );
			}
		for ( let m of this.mods ) {
			if ( m.abil == ability ) {
				mods.push(m);
				}
			}
		return mods;
		}
		
	// modify a value by all applicable mods in the list
	Apply( value, ability, include_parent = true ) { 
		// if i have a parent modlist, apply those first
		if ( this.parent && include_parent ) { 
			value = this.parent.Apply( value, ability );
			}
		for ( let m of this.mods ) {
			if ( m.abil == ability ) {
				value = m.Apply(value);
				}
			}
		return value;
		}
		
	static SortMods( a, b ) {
		let op_order = ['^','*','/','+','-','L','H','=']; // higher .. lower
		let a_op = op_order.indexOf( a.op );
		let b_op = op_order.indexOf( b.op );
		// ability 
		if ( a.abil > b.abil ) { return 1; }
		else if ( a.abil < b.abil ) { return -1; }
		// operator 
		if ( a_op > b_op ) { return 1; }
		else if ( a_op < b_op ) { return -1; }
		// value
		if ( a.val > b.val ) { return 1; }
		else if ( a.val < b.val ) { return -1; }
		return 0;
		}
	
	};

export class Mod { 
	abil = null;
	label = '';
	val = 0;
	op = '=';
	prov = null;
	constructor( ability, op, value, label, provider ) {
		this.abil = ability;
		this.val = parseFloat(value);
		this.op = op;
		this.label = label;
		this.prov = provider;
		}
	Apply( value ) { 
		switch ( this.op ) { 
			case 'H': { return this.val > value ? this.val : value; }
			case 'L': { return this.val < value ? this.val : value; }
			case '^': { return Math.pow( value, this.val ); }
			case '*': { return value * this.val; }
			case '/': { return value / this.val; }
			case '+': { return value + this.val; }
			case '-': { return value - this.val; }
			case '=': { return this.val; }
			default: { return value; }
			}
		}
	};
	
