export class FleetsPane {

	activate(data) {
		this.app = data.app;
		}
		
	 ClosePanel() {
		// this.app.CloseSideBar(); // keep this open
		this.app.CloseMainPanel(); 
		}
		
	ClickObject(o) { 
		this.app.SwitchSideBar(o);
		this.app.FocusMap(o);	
		}
		
	}
