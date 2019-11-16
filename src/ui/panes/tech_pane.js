import {Techs,TechNodes} from '../../classes/Tech';
import * as Signals from '../../util/signals';

export class TechPane {

	constructor() {
		// makes global objects available to template
		this.Techs = Techs;
		this.TechNodes = TechNodes;
		}

	activate(data) {
		this.app = data.app;
		this.mode = 'available';
		this.turn_subscription = Signals.Listen( 'turn', data => this.UpdateData() );
		this.featured_node = this.app.game.myciv.tech.current_project.node;
		// create flat lists for aurelia to cycle through.
		// This way we can sort and filter in the UI
		this.nodes_avail = [];
		this.nodes_compl = [];
		this.UpdateData();
		}
		
	UpdateData() {
		this.nodes_avail = Array.from( this.app.game.myciv.tech.nodes_avail.values() ).sort( (a,b) => a.node.rp - b.node.rp );
		this.nodes_compl = Array.from( this.app.game.myciv.tech.nodes_compl.values() ).filter( n => !n.hidden ).reverse();
		if ( this.mode == 'available' ) { 
			this.featured_node = this.app.game.myciv.tech.current_project ? this.app.game.myciv.tech.current_project.node : null;
			}
		}
		
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
		
	ClickCompletedTech( node ) { 
		this.featured_node = node;
		}
		
	ClickAvailableTech( node ) {
		this.app.game.myciv.SelectResearchProject(node.node.key);
		this.featured_node = this.app.game.myciv.tech.current_project.node;
		}
		
	ChangeMode( mode ) { 
		this.mode = mode=='available' ? mode : 'completed' ;
		if ( this.mode == 'available' ) { 
			this.featured_node = this.app.game.myciv.tech.current_project ? this.app.game.myciv.tech.current_project.node : null;
			}
		else {
			this.featured_node = this.nodes_compl.length ? this.nodes_compl[ this.nodes_compl.length-1 ] : null;
			}
		}
		
	unbind() { 
		this.turn_subscription.dispose();
		}
				
	}
