
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
	content_pane_obj = null; // composed content pane element. populates dynamically when content pane loads.
	
	constructor( app ) {
		this.app = app;
		this.app.options.show_range = false;
		this.app.exclusive_ui = false;
		this.PreloadImages();
		}

	detached() { 
		this.app.ResetEverything();
		this.app.game = null;
		this.current_scale = 1.0;
		document.body.className = document.body.className.replace('xtreme_zoom');
		this.xtreme_zoom = false;
		}
	
	PreloadImages() {
		if ( this.img_cache ) { return; } 
		let urls = [
			'img/map/caret.png',
			'img/map/sectors.png',	
			// 'img/planets/planet_20.png',
			// 'img/planets/planet_19.png',
			// 'img/planets/planet_24.png', 
			// 'img/planets/planet_15.png',
			// 'img/planets/planet_33.png',
			// 'img/planets/planet_16.png',
			// 'img/planets/planet_11.png',
			// 'img/planets/planet_00.png', 
			// 'img/planets/planet_17.png',
			// 'img/planets/planet_23.png', 
			// 'img/planets/planet_01.png',
			// 'img/planets/planet_08.png',
			// 'img/planets/planet_31.png',
			// 'img/planets/planet_21.png',
			// 'img/planets/planet_35.png',
			// 'img/planets/planet_03.png',
			// 'img/planets/planet_27.png',
			// 'img/planets/planet_26.png',
			// 'img/planets/planet_36.png',
			// 'img/planets/planet_02.png',
			// 'img/planets/planet_06.png',
			// 'img/planets/planet_04.png',
			// 'img/planets/planet_10.png',
			// 'img/planets/planet_12.png',
			// 'img/planets/planet_22.png',
			'img/planets/planet_20s.png', //
			'img/planets/planet_19s.png',
			'img/planets/planet_24s.png',
			'img/planets/planet_15s.png',
			'img/planets/planet_33s.png',
			'img/planets/planet_16s.png',
			'img/planets/planet_11s.png',
			'img/planets/planet_00s.png',
			'img/planets/planet_17s.png',
			'img/planets/planet_23s.png',
			'img/planets/planet_01s.png',
			'img/planets/planet_08s.png',
			'img/planets/planet_31s.png',
			'img/planets/planet_21s.png',
			'img/planets/planet_35s.png',
			'img/planets/planet_03s.png',
			'img/planets/planet_27s.png',
			'img/planets/planet_26s.png',
			'img/planets/planet_36s.png',
			'img/planets/planet_02s.png',
			'img/planets/planet_06s.png',
			'img/planets/planet_04s.png',
			'img/planets/planet_10s.png',
			'img/planets/planet_12s.png',
			'img/planets/planet_22s.png',
			// TODO: we can optimize SVG downloads by putting them into a font
			'img/icons/svg/cube01.svg',
			'img/icons/svg/building.svg',
			'img/icons/svg/home.svg',
			'img/icons/svg/building22.svg',
			'img/icons/svg/boxwire.svg',
			'img/icons/svg/city.svg',
			'img/icons/svg/stardock01.svg',
			'img/icons/svg/game.svg',
			'img/icons/svg/coins-1',
			'img/icons/svg/leaf.svg',
			'img/icons/svg/talkbubble.svg',
			'img/icons/svg/medical.svg',
			'img/icons/svg/transport.svg',
			'img/icons/svg/target.svg',
			'img/icons/svg/atom02.svg',
			'img/icons/svg/decoration.svg',
			'img/icons/svg/prism02.svg',
			'img/icons/svg/geoshape05.svg',
			'img/icons/svg/geoshape03.svg',
			'img/icons/svg/shield.svg',
			'img/icons/svg/spinner4.svg',
			'img/icons/svg/tool.svg',
			'img/icons/svg/hexstar3.svg',
			'img/icons/svg/focus.svg',
			'img/icons/svg/star.svg',
			'img/icons/svg/planet01.svg',
			'img/icons/svg/robot.svg',
			'img/icons/svg/hammer.svg',
			'img/icons/svg/rocket.svg',
			'img/icons/svg/heart.svg',
			'img/icons/svg/circle01.svg',
			];
		for ( let url of urls ) { 
			let img = new Image();
			img.src = url;
			}
		this.img_cache = true;
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
		else if ( obj instanceof Fleet ) { 
			if ( obj.star ) { x = obj.star.xpos; y = obj.star.ypos; }
			else { x = obj.xpos; y = obj.ypos; }
			}
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
		this.app.exclusive_ui = false;
		this.current_scale = 1.0;
		this.xtreme_zoom = false;
		document.body.className = document.body.className.replace('xtreme_zoom');
		
		// this might prevent mobile Safari pinch-zoom problems.
		// see: https://stackoverflow.com/questions/37808180/disable-viewport-zooming-ios-10-safari
		// window.addEventListener(
		// 	"touchmove",
		// 	function(event) {
		// 		if (event.scale !== 1) { event.preventDefault(); }
		// 		},
		// 	{ passive: false }
		// 	);

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
		
	// this helps with repeat-activation problems
	determineActivationStrategy() {
		return "replace";
		}
				
	}

	
	
	
