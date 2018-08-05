export class ColonizePane {

	activate(data) {
		this.app = data.app;
		this.planet = data.obj;
		}
		
	 ClickDone() {
		this.app.CloseMainPanel();
		this.app.SwitchSideBar(this.planet);
		}
	}
