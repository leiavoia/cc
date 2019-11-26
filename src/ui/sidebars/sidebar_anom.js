import * as Signals from '../../util/signals';

export class AnomDetailPane {
	anom = null;
	app = null;
	editing_name = false;
	
	activate(data) {
		this.app = data.app;
		this.anom = data.obj;
		this.turn_subscription = Signals.Listen('turn', data => this.UpdateData() );
		this.amount_researched = this.anom.AmountResearched( this.app.game.myciv );
		this.research_completed = this.anom.ResearchIsCompleted( this.app.game.myciv );
		}

	unbind() { 	
		this.turn_subscription.dispose();
		}
		
	UpdateData() { 
		this.amount_researched = this.anom.AmountResearched( this.app.game.myciv );
		this.research_completed = this.anom.ResearchIsCompleted( this.app.game.myciv );
		}
				
	}
