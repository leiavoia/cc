import * as Signals from '../util/signals';

export class LoadingState {
	attached() {
		Signals.Send('state_changed', this );
		}		
	}

	
	
	
