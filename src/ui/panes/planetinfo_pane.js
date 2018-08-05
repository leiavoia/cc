export class PlanetinfoPane {

	activate(data) {
		this.app = data.app;
		this.planet = data.obj;
		}
		
	 ClosePanel() {
		this.app.CloseMainPanel();
		}
	}
