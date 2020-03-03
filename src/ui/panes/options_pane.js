export class OptionsPane {

	activate(data) {
		if ( !data ) { return false; }
		this.app = data.app;
		}

	 ClosePanel() {
		this.app.SaveOptions();
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
		
		
	}
