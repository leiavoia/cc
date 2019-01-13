import * as Signals from '../../util/signals';
import { Chart } from 'chart.js';
export class EconPane {

	constructor() { 
		this.modes = [
			{key: 'power', label: 'Overall Power'},
			{key: 'research', label: 'Total Research'},
			{key: 'research_income', label: 'Research Per Turn'},
			{key: 'techs', label: 'Techs Researched'},
			{key: 'ships', label: 'Ships'},
			{key: 'milval', label: 'Military'},
			{key: 'cash', label: 'Treasury'},
			{key: 'planets', label: 'Planets'},
			{key: 'min_assault', label: 'Min Assault'}
			];
		this.mode = 'power';
		this.chart = null;
		}
		
	activate(data) {
		this.app = data.app;
		if ( this.app.options.history_mode ) { 
			this.mode = this.app.options.history_mode;
			}
		this.BuildDataset();
		this.turn_subscription = Signals.Listen( 'turn', data => this.AddTurn() );
		}
	
	AddTurn( data ) { 
	    this.chart.data.labels.push(this.chart.data.labels.length+1);
		let counter = 0;
		for ( let civ of this.app.game.galaxy.civs ) { 
			if ( !civ.race.is_monster ) { 
				if ( this.app.options.see_all || civ == this.app.game.myciv || civ.InRangeOf(this.app.game.myciv) ) { 
					this.datasets[counter].data.push(
						civ.stat_history[civ.stat_history.length-1][this.mode]
						);
					counter++;
					}
				}
			}
        this.chart.update();
		}
		
	BuildDataset() { 
		this.datasets = [];
		for ( let civ of this.app.game.galaxy.civs ) { 
			if ( !civ.race.is_monster ) { 
				if ( this.app.options.see_all || civ == this.app.game.myciv || civ.InRangeOf(this.app.game.myciv) ) { 
					this.datasets.push({
						label: civ.name,
						data: civ.stat_history.map( i => i[this.mode] ),
						// backgroundColor: `${civ.color}33`,
						backgroundColor: civ.color,
						borderColor: civ.color,
						borderWidth: 4,
						borderJoinStyle: 'round',
						pointRadius: 0,
						fill: false
						});			
					}
				}
			}
		}
    
	attached () { 
		let ctx = document.getElementById("myChart").getContext('2d');
		let xlabels = [];
		for ( let i=0; i < this.datasets[0].data.length; i++ ) {
			xlabels.push(i);
			}
		this.chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: xlabels,
				datasets: this.datasets
			},
			options: {
				aspectRatio: 2.6,
				legend: { 
					labels: {
						boxWidth: 20,
						fontSize: 14,
						fontColor: '#AAA',
						usePointStyle: false
						}
					},
				animation: {
					duration: 0, // general animation time
					},
				hover: {
					animationDuration: 0, // duration of animations when hovering an item
					},
				responsiveAnimationDuration: 0, // animation duration after a resize			
				elements: {
					line: {
						tension: 0, // disables bezier curves
						}
					},
				scales: {
					xAxes: [{
						ticks: {
							autoSkip: true,
							maxTicksLimit: 20
							}
						}]					
// 					yAxes: [{
// 						ticks: {
// 							beginAtZero:true
// 							}
// 						}]
					}
				}
			});

		}
		
	detached () { 
		this.chart.destroy();
		}
		
	unbind() { 
		this.turn_subscription.dispose();
		this.app.options.history_mode = this.mode; // save tab setting
		this.app.SaveOptions();
		}
		
	ChangeMode( mode ) { 
		this.mode = mode;
		this.BuildDataset();
		this.chart.data.datasets = this.datasets;
		this.chart.update({ duration: 0, easing: 'easeOutBounce' });
		}
		
	ClosePanel() {
		this.app.CloseSideBar();
		this.app.CloseMainPanel();
		}
	}
