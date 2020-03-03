export class ColonizePane {

	activate(data) {
		if ( !data ) { return false; }
		this.app = data.app;
		this.planet = data.obj;
		}
		
	 ClickDone() {
		this.app.CloseMainPanel();
		this.app.SwitchSideBar(this.planet);
		}
	}
