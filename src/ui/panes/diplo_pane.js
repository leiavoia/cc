export class DiploPane {

	
	modes = {}; // maps civ_id to current panel mode for each civ panel
	
	activate(data) {
		this.app = data.app;
		}
		
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}

	SpeakTo( civ ) { 
		let acct = this.app.game.myciv.diplo.contacts.get(civ);
		if ( acct && acct.attspan >= 0.1 && acct.comm ) {
			this.app.SwitchMainPanel( 'audience', civ, {on_exit:'diplo'}, true );
			}
		}
		
	ClickInfo( civ ) {
		this.modes[civ.id] = 'info';
		}
		
	ClickLog( civ ) {
		this.modes[civ.id] = 'log';
		}
		
	ClickAbout( civ ) {
		this.modes[civ.id] = 'about';
		}
		
	ClickRelations( civ ) {
		this.modes[civ.id] = 'relations';
		}
		
	}
