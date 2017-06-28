// import Planet from './classes/Planet';
// import {bindable} from 'aurelia-framework';

export class StarDetailPane {
	star = null;
	app = null;
	editing_name = false;
	
	activate(data) {
		this.app = data.app;
		this.star = data.obj;
		}
		
	PlanetSizeCSS( planet ) {
		let size = Math.round(planet.size * 0.572);
		if ( planet.size < 130 ) {
			let pos = 35 - (size * 0.5);
			return `background-size: ${size}px; background-position: ${pos}px 0%`;
			}
		else {
			let pos = 0; //75 - size;
			return `background-size: ${size}px; background-position: ${pos}px 0%`;
			}
		}
		
// 	bind () { 
// 		this.acct = this.star.Acct( this.app.game.iam );
// 		}
	ClickConstelLink() { 
		let acct = this.star.Acct(this.app.game.iam);
		if ( acct ) { 
			this.app.SwitchSideBar( acct.constel );
			}
		}
		
	ToggleNameEdit() { 
		this.editing_name = !this.editing_name;
		}
	}
