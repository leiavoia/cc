export class DiploPane {

	activate(data) {
		this.app = data.app;
		}
		
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}

	SpeakTo( civ ) { 
		let acct = civ.diplo.contacts.get(this.app.game.myciv);
		if ( acct.attspan && acct.comm ) {
			this.app.SwitchMainPanel( 'audience', civ, {on_exit:'diplo'}, true );
			}
		}
		
	}
