import Fleet from '../../classes/Fleet';
import {bindable,bindingMode} from 'aurelia-framework';

export class VersusBarCustomElement {
    @bindable v1;
    @bindable v2;
	v1_max = 1;
	v2_max = 0;
	total = 1;
	midpt = 0.5;
	split1 = 0.5;
	split2 = 1;

	bind() {
		this.v1_max = this.v1;
		this.v2_max = this.v2;
		this.Recalc();
		}
		
	v1Changed() { this.Recalc(); }
	v2Changed() { this.Recalc(); }
		
	Recalc() {
		this.v1_max = Math.max( this.v1_max, this.v1 );
		this.v2_max = Math.max( this.v2_max, this.v2 );
		this.total = (this.v1_max + this.v2_max) || 1;
		this.midpt = this.v1_max / this.total;
		this.split1 = this.v1 / this.total;
		this.split2 = ( this.v1_max + (this.v2_max - this.v2) ) / this.total;
		}
		
	}
