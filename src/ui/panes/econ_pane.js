import * as Signals from '../../util/signals';
import { Chart } from 'chart.js';
export class EconPane {

	constructor() {
		this.resource_keys = {
			$:'Cash',
			o:'Organics',
			s:'Silicates',
			m:'Metals',
			r:'Redium',
			g:'Verdagen',
			b:'Bluetonium',
			c:'Cyanite',
			v:'Violetronium',
			y:'Yellowtron',
			};
		this.zoneprod_keys = {
			hou: 'Housing',
			def: 'Defense',
			res: 'Research',
			ship: 'Ship Production',
			};
		this.spending_cats = {
			// 'zone.housing': 'Housing Zones', // not a cash expense
			// 'zone.economic': 'Economic Zones', // not a cash expense
			'zone.mining': 'Mining Zones',
			'zone.research': 'Research Zones',
			'zone.stardock': 'Stardock Zones',
			'zone.military': 'Military Zones',
			'ships.maint': 'Ship Maintenance',
			'troops.maint': 'Troop Maintenance',
			};
		this.modes = [
			{key: 'power', label: 'Overall Power'},
			{key: 'research', label: 'Total Research'},
			{key: 'research_income', label: 'Research Per Turn'},
			{key: 'techs', label: 'Techs Researched'},
			{key: 'ships', label: 'Ships'},
			{key: 'milval', label: 'Military'},
			{key: 'cash', label: 'Treasury'},
			{key: 'planets', label: 'Planets'},
			{key: 'min_assault', label: 'Min Assault'}
			];
		this.mode = 'power';
		}
		
	activate(data) {
		if ( !data ) { return false; }
		this.app = data.app;
		if ( this.app.options.history_mode ) { 
			this.mode = this.app.options.history_mode;
			}
		this.turn_subscription = Signals.Listen( 'turn', data => this.UpdateData() );
		}
			
	UpdateData() { 
		}
    
	attached () { 

		}
		
	detached () { 
		
		}
		
	unbind() { 
		this.turn_subscription.dispose();
		}
		
	ChangeMode( mode ) { 
		this.mode = mode;
		this.UpdateData();
		}
		
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
	}
