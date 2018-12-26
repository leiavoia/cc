export class OptionsPane {

	activate(data) {
		this.app = data.app;
		}

	 ClosePanel() {
		this.app.SaveOptions();
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
		
		
	}
