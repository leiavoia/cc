// import {bindable} from 'aurelia-framework';

export default class Hyperlane {
	
	owner = null; // civ
	from = null; // star
	to = null; // star
	level = 1; // speed
	
	angle = 0;
	length = 0;
	x1 = 0;
	y1 = 0;
	x2 = 0;
	y2 = 0;
	color = [255,255,255]; // shows ownership
	
	constructor( from, to, owner ) { 
		this.from = from;
		this.to = to;
		this.owner = owner;
		this.x1 = from.xpos;
		this.y1 = from.ypos;
		this.x2 = to.xpos;
		this.y2 = to.ypos;
		this.length = Math.sqrt(((this.x2-this.x1) * (this.x2-this.x1)) + ((this.y2-this.y1) * (this.y2-this.y1)));
		this.angle = Math.atan2((this.y2-this.y1),(this.x2-this.x1))*(180/Math.PI);
		if ( this.owner !== false ) { 
			this.color = this.owner.color_rgb;
			}
		}
		
	}
