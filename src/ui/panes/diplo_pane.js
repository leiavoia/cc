export class DiploPane {

	activate(data) {
		this.app = data.app;
		}
		
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}

	SpeakTo( civ ) { 
		this.app.SwitchMainPanel( 'audience', civ, null, true );
		}
		
	}
