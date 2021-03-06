
;( function( window ) {
	
	'use strict';

	// global
	var document = window.document,
		Modernizr = window.Modernizr;

	// https://gist.github.com/edankwan/4389601
	Modernizr.addTest('csstransformspreserve3d', function () {
		var prop = Modernizr.prefixed('transformStyle');
		var val = 'preserve-3d';
		var computedStyle;
		if(!prop) return false;

		prop = prop.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');

		Modernizr.testStyles('#modernizr{' + prop + ':' + val + ';}', function (el, rule) {
			computedStyle = window.getComputedStyle ? getComputedStyle(el, null).getPropertyValue(prop) : '';
		});

		return (computedStyle === val);
	});

	function extend( a, b ) {
		for( var key in b ) { 
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	function BookBlock( el, options ) {
		this.el = el;
		this.options = extend( this.defaults, options );
		this._init();
	}

	BookBlock.prototype = {
		defaults : {
			// vertical or horizontal flip
			orientation : 'vertical',
			// ltr (left to right) or rtl (right to left)
			direction : 'ltr',
			// speed for the flip transition in ms
			speed : 1000,
			// easing for the flip transition
			easing : 'ease-in-out',
			// if set to true, both the flipping page and the sides will have an overlay to simulate shadows
			shadows : true,
			// opacity value for the "shadow" on both sides (when the flipping page is over it)
			// value : 0.1 - 1
			shadowSides : 0.1,
			// opacity value for the "shadow" on the flipping page (while it is flipping)
			// value : 0.1 - 1
			shadowFlip : 0.1,
			// if we should show the first item after reaching the end
			circular : false,
			// if we want to specify a selector that triggers the next() function. example: ´#bb-nav-next´
			nextEl : '',
			// if we want to specify a selector that triggers the prev() function
			prevEl : '',
			// autoplay. If true it overwrites the circular option to true
			autoplay : false,
			// time (ms) between page switch, if autoplay is true
			interval : 3000,
			// callback after the flip transition
			// old is the index of the previous item
			// page is the current item´s index
			// isLimit is true if the current page is the last one (or the first one)
			onEndFlip : function(old, page, isLimit) { return false; },
			// callback before the flip transition
			// page is the current item´s index
			onBeforeFlip : function(page) { return false; }
		},
		_init : function() {
			// orientation class
			this.el.className += ' bb-' + this.options.orientation;
			// items
			this.items = Array.prototype.slice.call( this.el.querySelectorAll( '.bb-item' ) );
			// total items
			this.itemsCount = this.items.length;
			// current item´s index
			this.currentIdx = 0;
			// previous item´s index
			this.previous = -1;
			// show first item
			this.current = this.items[ this.currentIdx ];
			this.current.style.display = 'block';
			// get width of this.el
			// this will be necessary to create the flipping layout
			this.elWidth = this.el.offsetWidth;
			var transEndEventNames = {
				'WebkitTransition': 'webkitTransitionEnd',
				'MozTransition': 'transitionend',
				'OTransition': 'oTransitionEnd',
				'msTransition': 'MSTransitionEnd',
				'transition': 'transitionend'
			};
			this.transEndEventName = transEndEventNames[Modernizr.prefixed( 'transition' )];
			// support css 3d transforms && css transitions && Modernizr.csstransformspreserve3d
			this.support = Modernizr.csstransitions && Modernizr.csstransforms3d && Modernizr.csstransformspreserve3d;
			// initialize/bind some events
			this._initEvents();
			// start slideshow
			if ( this.options.autoplay ) {
				this.options.circular = true;
				this._startSlideshow();
			}
		},
		_initEvents : function() {

			var self = this;

			if ( this.options.nextEl !== '' ) {
				document.querySelector( this.options.nextEl ).addEventListener( 'click', function() { self._action( 'next' ); return false; } );
				document.querySelector( this.options.nextEl ).addEventListener( 'touchstart', function() { self._action( 'next' ); return false; } );
			}

			if ( this.options.prevEl !== '' ) {
				document.querySelector( this.options.prevEl ).addEventListener( 'click', function() { self._action( 'prev' ); return false; } );
				document.querySelector( this.options.prevEl ).addEventListener( 'touchstart', function() { self._action( 'prev' ); return false; } );
			}
			
			window.addEventListener( 'resize', function() { self._resizeHandler(); } );

		},
		_action : function( dir, page ) {
			this._stopSlideshow();
			this._navigate( dir, page );
		},
		_navigate : function( dir, page ) {

			if ( this.isAnimating ) {
				return false;
			}

			// callback trigger
			this.options.onBeforeFlip( this.currentIdx );

			this.isAnimating = true;
			// update current value
			this.current = this.items[ this.currentIdx ];

			if ( page !== undefined ) {
				this.currentIdx = page;
			}
			else if ( dir === 'next' && this.options.direction === 'ltr' || dir === 'prev' && this.options.direction === 'rtl' ) {
				if ( !this.options.circular && this.currentIdx === this.itemsCount - 1 ) {
					this.end = true;
				}
				else {
					this.previous = this.currentIdx;
					this.currentIdx = this.currentIdx < this.itemsCount - 1 ? this.currentIdx + 1 : 0;
				}
			}
			else if ( dir === 'prev' && this.options.direction === 'ltr' || dir === 'next' && this.options.direction === 'rtl' ) {
				if ( !this.options.circular && this.currentIdx === 0 ) {
					this.end = true;
				}
				else {
					this.previous = this.currentIdx;
					this.currentIdx = this.currentIdx > 0 ? this.currentIdx - 1 : this.itemsCount - 1;
				}
			}

			this.nextItem = !this.options.circular && this.end ? this.current : this.items[ this.currentIdx ];
			
			this.items.forEach( function( el, i ) { el.style.display = 'none'; } );
			if ( !this.support ) {
				this._layoutNoSupport( dir );
			} else {
				this._layout( dir );
			}

		},
		_layoutNoSupport : function(dir) {
			this.nextItem.style.display = 'block';
			this.end = false;
			this.isAnimating = false;
			var isLimit = dir === 'next' && this.currentIdx === this.itemsCount - 1 || dir === 'prev' && this.currentIdx === 0;
			// callback trigger
			this.options.onEndFlip( this.previous, this.currentIdx, isLimit );
		},
		// creates the necessary layout for the 3d structure and triggers the transitions
		_layout : function(dir) {

			var self = this,
				// basic structure: 1 element for the left side.
				s_left = this._addSide( 'left', dir ),
				// 1 element for the flipping/middle page
				s_middle = this._addSide( 'middle', dir ),
				// 1 element for the right side
				s_right = this._addSide( 'right', dir ),
				// overlays
				o_left = s_left.querySelector( 'div.bb-overlay' ),
				o_middle_f = s_middle.querySelector( 'div.bb-front' ).querySelector( 'div.bb-flipoverlay' ),
				o_middle_b = s_middle.querySelector( 'div.bb-back' ).querySelector( 'div.bb-flipoverlay' ),
				o_right = s_right.querySelector( 'div.bb-overlay' ),
				speed = this.end ? 400 : this.options.speed;

			var fChild = this.items[0];
			this.el.insertBefore( s_left, fChild );
			this.el.insertBefore( s_middle, fChild );
			this.el.insertBefore( s_right, fChild );
			s_left.style.zIndex = 102;
			s_middle.style.zIndex = 103;
			s_right.style.zIndex = 101;

			s_middle.style.transitionDuration = speed + 'ms';
			s_middle.style.transitionTimingFunction = this.options.easing;
			
			s_middle.addEventListener( this.transEndEventName, function( event ) {
				if ( (" " + event.target.className + " ").replace(/[\n\t]/g, " ").indexOf(" bb-page ") > -1 ) {
					Array.prototype.slice.call( self.el.querySelectorAll( '.bb-page' ) ).forEach( function( el, i ) {
						self.el.removeChild( el );
					} );
					self.nextItem.style.display = 'block';
					self.end = false;
					self.isAnimating = false;
					var isLimit = dir === 'next' && self.currentIdx === self.itemsCount - 1 || dir === 'prev' && self.currentIdx === 0;
					// callback trigger
					self.options.onEndFlip( self.previous, self.currentIdx, isLimit );
				}
			} );

			if ( dir === 'prev' ) {
				s_middle.className += ' bb-flip-initial';
			}

			// overlays
			if ( this.options.shadows && !this.end ) {
				if( dir === 'next' ) {
					o_middle_f.style.transition = 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear';
					o_middle_b.style.transition = 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms';
					o_middle_b.style.opacity = this.options.shadowFlip;
					o_left.style.transition = 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms';
					o_right.style.transition = 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear';
					o_right.style.opacity = this.options.shadowSides;
				}
				else if( dir === 'prev' ) {
					o_middle_f.style.transition = 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms';
					o_middle_f.style.opacity = this.options.shadowFlip;
					o_middle_b.style.transition = 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear';
					o_left.style.transition = 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear';
					o_left.style.opacity = this.options.shadowSides;
					o_right.style.transition = 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms';
				}
			}

			setTimeout( function() {
				// first && last pages lift slightly up when we can't go further
				s_middle.className += self.end ? ' bb-flip-' + dir + '-end' : ' bb-flip-' + dir;

				// overlays
				if ( self.options.shadows && !self.end ) {
					o_middle_f.style.opacity = dir === 'next' ? self.options.shadowFlip : 0;
					o_middle_b.style.opacity = dir === 'next' ? 0 : self.options.shadowFlip;
					o_left.style.opacity = dir === 'next' ? self.options.shadowSides : 0;
					o_right.style.opacity = dir === 'next' ? 0 : self.options.shadowSides;
				}
			}, 25 );
		},
		// adds the necessary sides (bb-page) to the layout 
		_addSide : function( side, dir ) {
			var sideEl = document.createElement( 'div' );
			sideEl.className = 'bb-page';

			switch (side) {
				case 'left':
						/*
						<div class="bb-page" style="z-index:102;">
							<div class="bb-back">
								<div class="bb-outer">
									<div class="bb-content">
										<div class="bb-inner">
											dir==='next' ? [content of current page] : [content of next page]
										</div>
									</div>
									<div class="bb-overlay"></div>
								</div>
							</div>
						</div>
						*/
					var inner = dir === 'next' ? this.current.innerHTML : this.nextItem.innerHTML;
					sideEl.innerHTML = '<div class="bb-back"><div class="bb-outer"><div class="bb-content"><div class="bb-inner">' + inner + '</div></div><div class="bb-overlay"></div></div></div>';
					break;
				case 'middle':
						/*
						<div class="bb-page" style="z-index:103;">
							<div class="bb-front">
								<div class="bb-outer">
									<div class="bb-content">
										<div class="bb-inner">
											dir==='next' ? [content of current page] : [content of next page]
										</div>
									</div>
									<div class="bb-flipoverlay"></div>
								</div>
							</div>
							<div class="bb-back">
								<div class="bb-outer">
									<div class="bb-content">
										<div class="bb-inner">
											dir==='next' ? [content of next page] : [content of current page]
										</div>
									</div>
									<div class="bb-flipoverlay"></div>
								</div>
							</div>
						</div>
						*/
					var frontinner = dir === 'next' ? this.current.innerHTML : this.nextItem.innerHTML;
					var backinner = dir === 'next' ? this.nextItem.innerHTML : this.current.innerHTML; 
					sideEl.innerHTML = '<div class="bb-front"><div class="bb-outer"><div class="bb-content"><div class="bb-inner">' + frontinner + '</div></div><div class="bb-flipoverlay"></div></div></div><div class="bb-back"><div class="bb-outer"><div class="bb-content" style="width:' + this.elWidth + 'px"><div class="bb-inner">' + backinner + '</div></div><div class="bb-flipoverlay"></div></div></div>';
					break;
				case 'right':
						/*
						<div class="bb-page" style="z-index:101;">
							<div class="bb-front">
								<div class="bb-outer">
									<div class="bb-content">
										<div class="bb-inner">
											dir==='next' ? [content of next page] : [content of current page]
										</div>
									</div>
									<div class="bb-overlay"></div>
								</div>
							</div>
						</div>
						*/
					var inner = dir === 'next' ? this.nextItem.innerHTML : this.current.innerHTML;
					sideEl.innerHTML = '<div class="bb-front"><div class="bb-outer"><div class="bb-content"><div class="bb-inner">' + inner + '</div></div><div class="bb-overlay"></div></div></div>';
					break;
			}

			return sideEl;
		},
		_startSlideshow : function() {
			var self = this;
			this.slideshow = setTimeout( function() {
				self._navigate( 'next' );
				if ( self.options.autoplay ) {
					self._startSlideshow();
				}
			}, this.options.interval );
		},
		_stopSlideshow : function() {
			if ( this.options.autoplay ) {
				clearTimeout( this.slideshow );
				this.options.autoplay = false;
			}
		},
		// public method: flips next
		next : function() {
			this._action( this.options.direction === 'ltr' ? 'next' : 'prev' );
		},
		// public method: flips back
		prev : function() {
			this._action( this.options.direction === 'ltr' ? 'prev' : 'next' );
		},
		// public method: goes to a specific page
		jump : function( page ) {

			page -= 1;

			if ( page === this.currentIdx || page >= this.itemsCount || page < 0 ) {
				return false;
			}
			var dir;
			if( this.options.direction === 'ltr' ) {
				dir = page > this.currentIdx ? 'next' : 'prev';
			}
			else {
				dir = page > this.currentIdx ? 'prev' : 'next';
			}
			this._action( dir, page );

		},
		// public method: goes to the last page
		last : function() {
			this.jump( this.itemsCount );
		},
		// public method: goes to the first page
		first : function() {
			this.jump( 1 );
		},
		// taken from https://github.com/desandro/vanilla-masonry/blob/master/masonry.js by David DeSandro
		// original debounce by John Hann
    	// http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
		_resizeHandler : function() {
			var self = this;
			function delayed() {
				self._resize();
				self._resizeTimeout = null;
			}
			if ( this._resizeTimeout ) {
				clearTimeout( this._resizeTimeout );
			}
			this._resizeTimeout = setTimeout( delayed, 50 );
		},
		_resize : function() {
			// update width value
			this.elWidth = this.el.offsetWidth;
		},
		// public method: check if isAnimating is true
		isActive: function() {
			return this.isAnimating;
		},
		// public method: dynamically adds new elements
		// call this method after inserting new "bb-item" elements inside the BookBlock
		update : function () {
			var currentItem = this.items[ this.current ];
			this.items = Array.prototype.slice.call( this.el.querySelectorAll( '.bb-item' ) );
			this.itemsCount = this.items.length;
			this.currentIdx = this.items.indexOf( currentItem );
		},
		destroy : function() {
			if ( this.options.autoplay ) {
				this._stopSlideshow();
			}
			this.el.className = this.el.className.replace(new RegExp("(^|\\s+)" + 'bb-' + this.options.orientation + "(\\s+|$)"), ' ');
			this.items.forEach( function( el, i ) { el.style.display = 'block'; } );

			if ( this.options.nextEl !== '' ) {
				this.options.nextEl.removeEventListener( 'click' );
				this.options.nextEl.removeEventListener( 'touchstart' );
			}

			if ( this.options.prevEl !== '' ) {
				this.options.prevEl.removeEventListener( 'click' );
				this.options.prevEl.removeEventListener( 'touchstart' );
			}

			window.removeEventListener( 'debouncedresize' );
		}
	}

	// add to global namespace
	window.BookBlock = BookBlock;

} )( window );

const page1 = document.querySelector('.page1fr')
const page2 = document.querySelector('.page2fr')
const page3 = document.querySelector('.page3fr')
const page4 = document.querySelector('.page4fr')
const page5 = document.querySelector('.page5fr')
const page6 = document.querySelector('.page6fr')
const page7 = document.querySelector('.page7fr')
const page8 = document.querySelector('.page8fr')
const page9 = document.querySelector('.page9fr')



const img = './frenchFlag.png'
const img2 = './englishFlag.png'


const en = './SVG/Page1-en.svg'
const en1 = './SVG/Page2-en.svg'
const en2 = './SVG/Page3-en.svg'
const en3 = './SVG/Page4-en.svg'
const en4 = './SVG/Page5-en.svg'
const en5 = './SVG/Page6-en.svg'
const en6 = './SVG/Page7-en.svg'
const en7 = './SVG/Page8-en.svg'
const en8 = './SVG/Page9-en.svg'

const fr = './SVG/Page1-fr.svg'
const fr1 = './SVG/Page2-fr.svg'
const fr2 = './SVG/Page3-fr.svg'
const fr3 = './SVG/Page4-fr.svg'
const fr4 = './SVG/Page5-fr.svg'
const fr5 = './SVG/Page6-fr.svg'
const fr6 = './SVG/Page7-fr.svg'
const fr7 = './SVG/Page8-fr.svg'
const fr8 = './SVG/Page9-fr.svg'

console.log(img)
let counter = 0

const englishFlag = document.querySelector('.englishFlag')
console.log(englishFlag)

englishFlag.addEventListener('click', () =>
{
	counter++
	console.log(counter)
	if(counter%2 != 0)
	{
		englishFlag.src = `${img}`
		page1.src = `${en}`
		page2.src = `${en1}`
		page3.src = `${en2}`
		page4.src = `${en3}`
		page5.src = `${en4}`
		page6.src = `${en5}`
		page7.src = `${en6}`
		page8.src = `${en7}`
		page9.src = `${en8}`
	}
	else if(counter%2 == 0)
	{
		englishFlag.src = `${img2}`
		page1.src = `${fr}`
		page2.src = `${fr1}`
		page3.src = `${fr2}`
		page4.src = `${fr3}`
		page5.src = `${fr4}`
		page6.src = `${fr5}`
		page7.src = `${fr6}`
		page8.src = `${fr7}`
		page9.src = `${fr8}`
	}
	console.log('coucou')
})