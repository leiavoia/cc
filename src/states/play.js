
import Star from '../classes/Star';
import Planet from '../classes/Planet';
import Hyperlane from '../classes/Hyperlane';
import Constellation from '../classes/Constellation';
import Fleet from '../classes/Fleet';
import * as utils from '../util/utils';
import {inject} from 'aurelia-framework';
import {App} from '../app';
// import {VelocityAnimator} from "aurelia-animator-velocity";

@inject(App/*,VelocityAnimator*/)
export class PlayState {


	// map stuff
	current_scale = 1.0;
	max_scale = 1.0;
	min_scale = 0.05;
	scaling_step = 0.125;
		
	constructor( app /*anim*/ ) {
		this.app = app;
// 		this.anim = anim;
// 		this.app.state_obj = this;
		}

	unattach() { 
		this.app.ResetEverything();
		this.current_scale = 1.0;
		document.body.className = document.body.className.replace('xtreme_zoom');
		}
		
	// can be a Star, Planet, Fleet, or an x/y pair: {x:100,y:100}
	FocusMap( obj, snap = false ) { 
		let x, y = 0;
		if ( obj instanceof Star ) { x = obj.xpos; y = obj.ypos; }
		else if ( obj instanceof Planet ) { x = obj.star.xpos; y = obj.star.ypos; }
		else if ( obj instanceof Fleet ) { x = obj.xpos; y = obj.ypos; }
		else { x = obj.x; y = obj.y; } // not a safe fallback
		
		let div = document.getElementById('layout_map');
		let parent = document.getElementById('layout_viewport');
		
		// calculate difference between map at full size and scaled size.
		// This lets us bump the scaled coords into the correct real-world spot.
		// +---------+
		// | +-----+ |         
		// |H|  x  | |
		// | +-----+ |         
		// +---------+
		let halfdiff_x = ( (div.clientWidth - (div.clientWidth*this.current_scale)) * 0.5 );
		let halfdiff_y = ( (div.clientHeight - (div.clientHeight*this.current_scale)) * 0.5 );
		
		// figure out where the target is as a percentage of the map (0..1)
		let map_x_pct = x / div.clientWidth;
		let map_y_pct = y / div.clientHeight;
		
		// convert and translate coords back to scroll space
		let new_x = halfdiff_x + (div.clientWidth * this.current_scale * map_x_pct);
		let new_y = halfdiff_y + (div.clientHeight * this.current_scale * map_y_pct);
		
		// calculate the actual scroll position for the DOM element (and clamp result)
		let new_scrollleft = new_x - ( 0.5 * parent.clientWidth );
		if ( new_scrollleft < 0 ) { new_scrollleft = 0; }
		if ( new_scrollleft > div.clientWidth - parent.clientWidth) { new_scrollleft = div.clientWidth - parent.clientWidth; }
		
		let new_scrolltop = new_y - ( 0.5 * parent.clientHeight );
		if ( new_scrolltop < 0 ) { new_scrolltop = 0; }
		if ( new_scrolltop > div.clientHeight - parent.clientHeight) { new_scrolltop = div.clientHeight - parent.clientHeight; }
		
		// center the viewport on the clicked point
		parent.scrollTop = new_scrolltop; 
		parent.scrollLeft = new_scrollleft;

// 		this.anim.runSequence([
// 			{ e: parent, p: { scrollTop: new_scrolltop, scrollLeft: new_scrollleft }, o: { duration: 2000 } },
// 			]);
			
		
// 		this.anim.animate(parent,"scroll",{duration: 2000, offset: new_scrollleft, axis: 'x'});
// 		this.anim.animate(parent,"scroll",{duration: 2000, offset: new_scrolltop, axis: 'y'});

		}
		
	MapScroll( xdiff, ydiff ) { 
		let vp = document.getElementById('layout_viewport');
		// normalize
		xdiff = xdiff > 0 ? 1 : (xdiff < 0 ? -1 : 0); 
		ydiff = ydiff > 0 ? 1 : (ydiff < 0 ? -1 : 0); 
		vp.scrollLeft += vp.clientWidth * 0.4 * xdiff;	
		vp.scrollTop += vp.clientHeight * 0.4 * ydiff; 
		}
	MapZoomIn() { 
		let vp = document.getElementById('layout_viewport');
		this.MapZoom( vp.clientWidth*0.5, vp.clientHeight*0.5, -3 );
		}
	MapZoomOut() { 
		let vp = document.getElementById('layout_viewport');
		this.MapZoom( vp.clientWidth*0.5, vp.clientHeight*0.5, 3 );
		}
		
	MapZoom( pageX=null, pageY=null, steps=1 ) { 
		var div = document.getElementById('layout_map');
		var parent = document.getElementById('layout_viewport');
		
		// calculate where the click happened in mapspace
		var click_x = (pageX + parent.scrollLeft)/* + ( div.clientWidth * this.current_scale * 0.5)*/ ;
		var click_y = (pageY + parent.scrollTop)/* + ( div.clientHeight * this.current_scale * 0.5) */;
		
		// calculate difference between map at full size and scaled size.
		// This lets us bump the scaled coords into the correct real-world spot.
		// +---------+
		// | +-----+ |         
		// |H|  x  | |
		// | +-----+ |         
		// +---------+
		var halfdiff_x = ( (div.clientWidth - (div.clientWidth*this.current_scale)) * 0.5 );
		var halfdiff_y = ( (div.clientHeight - (div.clientHeight*this.current_scale)) * 0.5 );
		
		// figure out where the target is as a percentage of the map (0..1)
		// Normally you would just use (coord / width) however it causes
		// jerking depending on where on the screen the cursor was (click_x).
		// We put some extra jiggers here to counteract the jerking offsets.
		var map_x_pct = (click_x - halfdiff_x ) / (div.clientWidth*this.current_scale);
		var map_y_pct = (click_y - halfdiff_y ) / (div.clientHeight*this.current_scale);
		
		// change scale on layout_map
		if ( steps < 0 && this.current_scale < this.max_scale ) { 
			this.current_scale *= 1.0 - (this.scaling_step * steps); 
			if ( this.current_scale > this.max_scale ) { this.current_scale = this.max_scale; }
			}
		else if ( steps > 0 && this.current_scale > this.min_scale ) { 
			this.current_scale *= 1.0 - (this.scaling_step * steps); 
			if ( this.current_scale < this.min_scale ) { this.current_scale = this.min_scale; }
			}
		// note: we would eventually like to be perspective:1px instead of scale
	// 	div.style.transform = 'translateZ(-' + ( 0.5 / this.current_scale ) + 'px)';
		div.style.transform = 'scale('+this.current_scale+')';
		
		// repeat since we changed scale
		var halfdiff_x = ( (div.clientWidth - (div.clientWidth*this.current_scale)) * 0.5 );
		var halfdiff_y = ( (div.clientHeight - (div.clientHeight*this.current_scale)) * 0.5 );
		
		// convert and translate coords back to scroll space
		var new_x = halfdiff_x + (div.clientWidth * this.current_scale * map_x_pct);
		var new_y = halfdiff_y + (div.clientHeight * this.current_scale * map_y_pct);
		
		// we DONT want to center the screen on the new point - it causes jerking.
		// instead, introduce the original screen offset
		var pix_diff_x = pageX - ( 0.5 * parent.clientWidth )
		var pix_diff_y = pageY - ( 0.5 * parent.clientHeight )
		
		// calculate the actual scroll position for the DOM element (and clamp result)
		var new_scrollleft = new_x - ( 0.5 * parent.clientWidth ) - pix_diff_x;
			if ( new_scrollleft < 0 ) { new_scrollleft = 0; }
			if ( new_scrollleft > div.clientWidth - parent.clientWidth) { new_scrollleft = div.clientWidth - parent.clientWidth; }
		var new_scrolltop = new_y - ( 0.5 * parent.clientHeight ) - pix_diff_y;
			if ( new_scrolltop < 0 ) { new_scrolltop = 0; }
			if ( new_scrolltop > div.clientHeight - parent.clientHeight) { new_scrolltop = div.clientHeight - parent.clientHeight; }
		
		// center the viewport on the clicked point
		parent.scrollTop = new_scrolltop; 
		parent.scrollLeft = new_scrollleft;
		
		// for that extra special effect, we can also zoom in on the background.
		// note: background scale = 125% @ zoom = 1.0, 100% @ zoom = 0.0
		var bgsize = 100.0 + (20.0 * this.current_scale);
		// note that blank space will show if we assume the viewport 
		// has a narrower aspect ratio than the image itself. Since we dont have
		// info on the image, lets just use a rule of thumb. The other thing we can do
		// is make all images a known aspect ratio and make assumptions about it here.
		let str = (parent.clientHeight > parent.clientWidth ) ? ("auto " + bgsize + "%") : (bgsize + "% auto");
		document.getElementById('layout_pagewrap').style.backgroundSize = str;

		
		if ( this.current_scale < 0.30 && document.body.className.indexOf('xtreme_zoom') == -1 ) {
			document.body.className += ' xtreme_zoom';
			}
		else if ( this.current_scale >= 0.30 && document.body.className.indexOf('xtreme_zoom') > -1 ) {
			document.body.className = document.body.className.replace('xtreme_zoom');
			}
			
		// prevent scrolling
		return false;
			
		}
	/* this executes when DOM is ready */
	attached () {
		//
		// NOTE: the app only needs to do this once at startup.
		// The events seem to persist even when we transition to 
		// the startup screen. Happy accident.
		//
		if ( !PlayState.dragscroll_init ) { 
			/* setup dragable map -- code imported directly from dragscroll.js */
	// 		!function(e,n){"function"==typeof define&&define.amd?define(["exports"],n):n("undefined"!=typeof exports?exports:e.dragscroll={})}(this,function(e){var n=window,t=document,o="mousemove",l="mouseup",i="mousedown",c="EventListener",r="add"+c,m="remove"+c,d=[],s=function(e,c){for(e=0;e<d.length;)c=d[e++],c=c.container||c,c[m](i,c.md,0),n[m](l,c.mu,0),n[m](o,c.mm,0);for(d=[].slice.call(t.getElementsByClassName("dragscroll")),e=0;e<d.length;)!function(e,c,m,d,s,a){(a=e.container||e)[r](i,a.md=function(n){e.hasAttribute("nochilddrag")&&t.elementFromPoint(n.pageX,n.pageY)!=a||(d=1,c=n.clientX,m=n.clientY,n.preventDefault())},0),n[r](l,a.mu=function(){d=0},0),n[r](o,a.mm=function(n){d&&((s=e.scroller||e).scrollLeft-=-c+(c=n.clientX),s.scrollTop-=-m+(m=n.clientY))},0)}(d[e++])};"complete"==t.readyState?s():n[r]("load",s,0),e.reset=s});
			(function (root, factory) {
				factory((root.dragscroll = {}))
				}(this, function (exports) {
				var _window = window;
				var _document = document;
				var mousemove = 'mousemove';
				var mouseup = 'mouseup';
				var mousedown = 'mousedown';
				var EventListener = 'EventListener';
				var addEventListener = 'add'+EventListener;
				var removeEventListener = 'remove'+EventListener;

				var dragged = [];
				var reset = function(i, el) {
					for (i = 0; i < dragged.length;) {
						el = dragged[i++];
						el = el.container || el;
						el[removeEventListener](mousedown, el.md, 0);
						_window[removeEventListener](mouseup, el.mu, 0);
						_window[removeEventListener](mousemove, el.mm, 0);
					}

					// cloning into array since HTMLCollection is updated dynamically
					dragged = [].slice.call(_document.getElementsByClassName('dragscroll'));
					for (i = 0; i < dragged.length;) {
						(function(el, lastClientX, lastClientY, pushed, scroller, cont){
							(cont = el.container || el)[addEventListener](
								mousedown,
								cont.md = function(e) {
								if (!el.hasAttribute('nochilddrag') ||
									_document.elementFromPoint(
										e.pageX, e.pageY
									) == cont
								) {
									pushed = 1;
									lastClientX = e.clientX;
									lastClientY = e.clientY;

									e.preventDefault();
								}
								}, 0
							);

							_window[addEventListener](
								mouseup, cont.mu = function() {pushed = 0;}, 0
							);

							_window[addEventListener](
								mousemove,
								cont.mm = function(e) {
								if (pushed) {
									(scroller = el.scroller||el).scrollLeft -=
										(- lastClientX + (lastClientX=e.clientX));
									scroller.scrollTop -=
										(- lastClientY + (lastClientY=e.clientY));
								}
								}, 0
							);
						})(dragged[i++]);
					}
				}

					
				if (_document.readyState == 'complete') {
					reset();
				} else {
					_window[addEventListener]('load', reset, 0);
				}

// 				exports.reset = reset;
				}));
		
			// zoom and pan functions ---------\/----------------
			
			// parallax scrolling
			document.getElementById('layout_viewport').addEventListener("scroll", function(){
				var div = document.getElementById('layout_viewport');
				// the 100% corresponds to the 100% of the background-size
				var v_perc = 100 * div.scrollTop / ( div.scrollHeight - div.clientHeight ); 
				var h_perc = 100 * div.scrollLeft / ( div.scrollWidth - div.clientWidth ); 
				var str = h_perc + '% ' + v_perc + '%';
				document.getElementById('layout_pagewrap').style.backgroundPosition = str;
				return false;
				});
				
			// zoom
			let state = this;
			['wheel', 'resize'].forEach( function ( event1 ) { 
				document.getElementById('layout_viewport').addEventListener(event1, function(event){
					state.MapZoom( event.pageX, event.pageY, ( event.deltaY > 0 ? 1 : -1 ) );
					// prevent scrolling
					event.preventDefault();
					event.returnValue = false;
					return false;
					});		
				});
					
			PlayState.dragscroll_init = true;
			}
			
			
		// focus on the home system if there is one
		// [!]FUTURE-TODO - This is where the dramatic intro would go in the future.
		if ( this.app.hilite_star ) { 
			this.FocusMap( this.app.hilite_star );
			}
		}
		
		
		
		
	}

	
	
	
