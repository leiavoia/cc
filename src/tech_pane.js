import * as Tech from './classes/Tech';
import {bindable} from 'aurelia-framework';

export class TechPane {
	 @bindable app = null;

	 ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
		
	ClickCompletedTech( node ) { 
		// focus the node	
		}
		
	ClickAvailableTech( node ) { 
		// switch the research project
		this.app.game.myciv.SelectResearchProject(node);
		}
		
	AutoDesc( node ) { 
		if ( !node ) { return ''; }
		return node.node.desc || Tech.Techs[ node.node.yields[0] ].desc;
		}
	
	AutoName( node ) { 
		if ( !node ) { return ''; }
		return node.node.name || Tech.Techs[ node.node.yields[0] ].name;
		}
		
	}
