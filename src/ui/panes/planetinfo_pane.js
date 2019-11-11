import * as Signals from '../../util/signals';
import { Chart } from 'chart.js';

export class PlanetinfoPane {

	ship_dest_opts = [];
	// chart = null;
	// datasets = [];
	// chart_colors = {
	// 	$: '#AEA',
	// 	hou: '#4cb0e9',
	// 	def: '#98543D',
	// 	ship: '#FAA',
	// 	res: '#14A',
	// 	pop: '#FFF',
	// 	morale: '#EEA',
	// 	pci: '#666',
	// 	o: '#AA7449',
	// 	s: '#666666',
	// 	m: '#DDDDDD',
	// 	r: '#DD1111',
	// 	g: '#00FF33',
	// 	b: '#0033FF',
	// 	c: '#11EEFF',
	// 	y: '#EE11FF',
	// 	v: '#FFFF00'
	// 	};
	
	activate(data) {
		this.app = data.app;
		this.planet = data.obj;
			
		// list of valid destinations for newly constructed ships
		this.ship_dest_opts.push({name:'Stay Here', value:null});
		if ( this.planet.owner.ai.staging_pts.length ) { 
			this.ship_dest_opts.push({name:'Nearest Staging Point', value:'@'});
			}
		for ( let s of this.planet.owner.MyStars() ) { 
			if ( s != this.planet.star ) { 
				this.ship_dest_opts.push({name:s.name, value:s});
				}
			}
			
		// graphing
		// this.BuildDataset();
		this.turn_subscription = Signals.Listen( 'turn', data => this.AddTurn() );			
		}
		
	 ClosePanel() {
		this.app.CloseMainPanel();
		}
		
	AddTurn( data ) { 
	    // if ( !this.datasets.length ) { this.BuildDataset(); }
	    // if ( !this.chart ) { this.AttachGraph(); }
		// this.chart.data.labels.push(this.chart.data.labels.length+1);
		// let counter = 0;
		// for ( let k in this.planet.acct_hist[0] ) {
		// 	this.datasets[counter].data.push(
		// 		this.planet.acct_hist[this.planet.acct_hist.length-1][k]
		// 		);
		// 	counter++;
		// 	}
        // this.chart.update();
		}
		
	BuildDataset() { 
		// if ( !this.planet.acct_hist.length ) { return; }
		// for ( let k in this.planet.acct_hist[0] ) { 
		// 	this.datasets.push({
		// 		label: k,
		// 		data: this.planet.acct_hist.map( i => i[k] ),
		// 		backgroundColor: (this.chart_colors[k] || '#FFFFFF'),
		// 		borderColor: (this.chart_colors[k] || '#FFFFFF'),
		// 		borderWidth: 2,
		// 		borderJoinStyle: 'round',
		// 		pointRadius: 0,
		// 		fill: false
		// 		});			
		// 	}
		}
		
   
	attached() {
		// this.AttachGraph();
		}
		 
	AttachGraph() { 
// 		if ( !this.planet.acct_hist.length || this.chart ) { return; }
// 		let ctx = document.getElementById("acct_graph").getContext('2d');
// 		let xlabels = [];
// 		for ( let i=0; i < this.datasets[0].data.length; i++ ) {
// 			xlabels.push(i);
// 			}
// 		this.chart = new Chart(ctx, {
// 			type: 'line',
// 			data: {
// 				labels: xlabels,
// 				datasets: this.datasets
// 			},
// 			options: {
// 				aspectRatio: 2.6,
// 				legend: { 
// 					labels: {
// 						boxWidth: 20,
// 						fontSize: 14,
// 						fontColor: '#AAA',
// 						usePointStyle: false
// 						}
// 					},
// 				animation: {
// 					duration: 0, // general animation time
// 					},
// 				hover: {
// 					animationDuration: 0, // duration of animations when hovering an item
// 					},
// 				responsiveAnimationDuration: 0, // animation duration after a resize			
// 				elements: {
// 					line: {
// 						tension: 0, // disables bezier curves
// 						}
// 					},
// 				scales: {
// 					xAxes: [{
// 						ticks: {
// 							autoSkip: true,
// 							maxTicksLimit: 20
// 							}
// 						}]					
// // 					yAxes: [{
// // 						ticks: {
// // 							beginAtZero:true
// // 							}
// // 						}]
// 					}
// 				}
// 			});

		}
		
	detached () { 
		// this.chart.destroy();
		}
		
	unbind() { 
		this.turn_subscription.dispose();
		}
				
		
		
				
	}
