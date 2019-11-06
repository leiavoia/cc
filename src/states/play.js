
import Star from '../classes/Star';
import Anom from '../classes/Anom';
import Planet from '../classes/Planet';
import Fleet from '../classes/Fleet';
import {inject} from 'aurelia-framework';
import {App} from '../app';
import createPanZoom from 'panzoom';
import * as Signals from '../util/signals';

@inject(App)
export class PlayState {

	// map stuff
	current_scale = 1.0;
	max_scale = 1.0;
	min_scale = 0.025;
	scaling_step = 0.125;
	bg_img_w = 2500; // standardized bg img dims
	bg_img_h = 1400; // but can accomodate any image 
	xtreme_zoom = false;
	caret = { obj: null, x: 0, y: 0, class: null };
	panzoom = null; // scroll controller
	
	constructor( app ) {
		this.app = app;
		this.app.options.show_range = false;
		}

	detached() { 
		this.app.ResetEverything();
		this.app.game = null;
		this.current_scale = 1.0;
		document.body.className = document.body.className.replace('xtreme_zoom');
		this.xtreme_zoom = false;
		}
	
	SetCaret( obj ) { 
		if ( (obj instanceof Star) || (obj instanceof Anom) ) { 
			this.caret.x = obj.xpos; 
			this.caret.y = obj.ypos; 
			this.caret.obj = obj;
			this.caret.class = 'star';
			}
		else if ( obj instanceof Planet ) { 
			this.caret.x = obj.star.xpos; 
			this.caret.y = obj.star.ypos; 
			this.caret.obj = obj.star;
			this.caret.class = 'star';
			}
		else if ( obj instanceof Fleet && !obj.killme && !obj.merged_with ) { 
			this.caret.x = obj.xpos; 
			this.caret.y = obj.ypos; 
			// HACK: if we are updating the caret and following the same fleet,
			// update the class from 'fleet' to 'fleet_follow'. This prevents
			// the caret from floating around the screen when switching from 
			// any other object to this fleet. We also want to switch coords to
			// star if the fleet is parked.
			if ( obj.star && !obj.dest ) { 
				this.caret.obj = obj;
				this.caret.class = 'star';
				this.caret.x = obj.star.xpos; 
				this.caret.y = obj.star.ypos; 
				}
			else if ( this.caret.obj == obj ) { 
				this.caret.class = 'fleet_follow';
				}
			else {
				this.caret.obj = obj;
				this.caret.class = 'fleet';
				}
			}
		else { 
			this.caret.x = 0;
			this.caret.y = 0; 
			this.caret.obj = null;
			this.caret.class = null;
			} 
		}

	// can be a Star, Planet, Fleet, or an x/y pair: {x:100,y:100}
	FocusMap( obj, snap = true ) { 
		let x, y = 0;
		if ( obj instanceof Star || obj instanceof Anom ) { x = obj.xpos; y = obj.ypos; }
		else if ( obj instanceof Planet ) { x = obj.star.xpos; y = obj.star.ypos; }
		else if ( obj instanceof Fleet ) { x = obj.xpos; y = obj.ypos; }
		else { x = obj.x; y = obj.y; } // not a safe fallback
		this.SetCaret( obj );
		let map = document.getElementById('layout_map');
		let vp = document.getElementById('layout_viewport');
		if ( !snap ) { map.className += ' smooth_move'; }
		this.panzoom.moveTo( 
			(-x * this.current_scale) + (0.5 * vp.clientWidth),
			(-y * this.current_scale) + (0.5 * vp.clientHeight) 
			);
		if ( !snap ) { 
			setTimeout( () => map.className = map.className.replace('smooth_move'), 500 );
			}
		}
		
	MapScroll( xdiff, ydiff ) {
		let t = this.panzoom.getTransform();
		this.panzoom.moveBy(-xdiff * t.scale, -ydiff * t.scale);
		}
		
	MapZoomIn() { 
		let vp = document.getElementById('layout_viewport');
		let t = this.panzoom.getTransform();
		let to_scale = t.scale * 3;
		let ownerRect = vp.getBoundingClientRect();
		this.panzoom.smoothZoomAbs(ownerRect.width*0.5, ownerRect.height*0.5, to_scale);
		}
		
	MapZoomOut() { 
		let vp = document.getElementById('layout_viewport');
		let t = this.panzoom.getTransform();
		let to_scale = t.scale * 0.333;
		let ownerRect = vp.getBoundingClientRect();
		this.panzoom.smoothZoomAbs(ownerRect.width*0.5, ownerRect.height*0.5, to_scale);
		}
	
	// grab the nebula background image and measure exact dimensions
	GetBGDims() {
		let img = new Image();
		let playstate = this;
		// need to use the onload event because we cant
		// access the data until it finishes.
		img.onload = function ( event ) {
			playstate.bg_img_w = img.width; 
			playstate.bg_img_h = img.height;
			};
		img.src = this.app.game.galaxy.bg_img;
		}
			
	RecalcBGSize() { 
		// background scale = 125% @ zoom = 1.0, 100% @ zoom = 0.0
		let vp = document.getElementById('layout_viewport');
		if ( !vp ) { return; }
		var bgsize = 100.0 + (25.0 * this.current_scale);
		let img_ratio = this.bg_img_h / this.bg_img_w;
		let screen_ratio = vp.clientHeight / vp.clientWidth;
		let str = (screen_ratio > img_ratio) ? ("auto " + bgsize + "%") : (bgsize + "% auto");
		document.getElementById('layout_pagewrap').style.backgroundSize = str;	
		this.AdjustForParallax();
		}
		
	AdjustForParallax() { 
		// the 100% corresponds to the 100% of the background-size
		let trf = this.panzoom.getTransform();
		let vp = document.getElementById('layout_viewport');
		let mapwrap = document.querySelector('#layout_map');
		let v_off = mapwrap.clientHeight*0.5 - ( (-trf.y + vp.clientHeight*0.5) / this.current_scale );
		let h_off = mapwrap.clientWidth*0.5 - ( (-trf.x + vp.clientWidth*0.5) / this.current_scale );
		let v_perc = ( 100 * -(v_off/mapwrap.clientHeight) * this.current_scale ) + 50; 
		let h_perc = ( 100 * -(h_off/mapwrap.clientWidth) * this.current_scale ) + 50; 
		let str = h_perc + '% ' + v_perc + '%';
		document.getElementById('layout_pagewrap').style.backgroundPosition = str;
		}
		
	attached () {
		this.current_scale = 1.0;
		this.xtreme_zoom = false;
		document.body.className = document.body.className.replace('xtreme_zoom');
		
		// make annoying context menu go away
		document.addEventListener('contextmenu', function(e) {
			e.preventDefault();
			return false;
			},false);
			
		// right click makes sidebars go away
// 			document.addEventListener('click', e => {
//     				if ( e.button == 2 ) { 
// 					e.preventDefault();
//     					this.app.CloseSideBar();
//     					}
// 				});

		// zoom and pan functions ---------\/----------------
		let mapwrap = document.querySelector('#layout_map');
		this.panzoom = createPanZoom( mapwrap, {
			smoothScroll: false, // no momentum
			maxZoom: this.max_scale,
			minZoom: this.min_scale,
			zoomSpeed: this.scaling_step,
			bounds: true, // no infinite scrolling
			boundsPadding: 0.25, // mysterious number that seems to work
			// don't prevent single-touch event from normal stuff-clicking
			onTouch: e => { 
				if ( e.targetTouches.length > 1 ) { 
					e.preventDefault();
					e.stopPropagation(); 
					return true;
					}
				return false;
				}, 
			// onDoubleClick: e => false, // dont prevent double clicks
			});
		this.panzoom.on('transform', e => {
			let scale_from = this.current_scale;
			let trf = this.panzoom.getTransform();
			this.current_scale = trf.scale;
			// background zoom
			if ( scale_from != trf.scale ) { 
				this.RecalcBGSize(); // also does parallax
				}
			// parallax scrolling
			else { 
				this.AdjustForParallax(); 
				}
			// tactical view switching
			
			if ( this.current_scale < this.app.options.xtreme_zoom_at && document.body.className.indexOf('xtreme_zoom') == -1 ) {
				document.body.className += ' xtreme_zoom';
				this.xtreme_zoom = true;
				}
			else if ( this.current_scale >= this.app.options.xtreme_zoom_at && document.body.className.indexOf('xtreme_zoom') > -1 ) {
				document.body.className = document.body.className.replace('xtreme_zoom');
				this.xtreme_zoom = false;
				}
			});

		// window resize
		window.addEventListener('resize', event => { 
			this.RecalcBGSize();
			return false;
			});	
		
		// focus on the home system if there is one, or zoomed out in debug view
		if ( !this.app.hilite_star || this.app.options.debug ) { 
			this.panzoom.showRectangle( {left:0, top:0, bottom:this.app.game.galaxy.height, right:this.app.game.galaxy.width} );
			}
		else {
			this.FocusMap( this.app.hilite_star );
			this.app.hilite_star = null;
			}
				
		// set the initial background size
		this.GetBGDims();
		this.RecalcBGSize();
			
		Signals.Send('state_changed', this );
		}
		
	}

	
	
	
