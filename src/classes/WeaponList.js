
// for internal use
const WeaponFX = {
	DEFAULT: { // AKA "laser"
		bg: 'linear-gradient( to right, rgba(255,30,15,0) 0%, rgba(255,30,15,1) 100% )',
		borderRadius: '50%',
		w: 175,
		h: 6 
		},
	MEGARED: {
		bg: 'radial-gradient(closest-side, #FFF 0%, #FFF 30%, transparent 50%, transparent 100%), radial-gradient(closest-side, rgb(255,30,15) 0%, rgb(255,30,15) 40%, transparent 100%)',
		w: 500,
		h: 66 
		},
	LASERSMALL: {
		bg: 'linear-gradient( to right, rgba(255,30,15,0) 0%, rgba(255,30,15,1) 100% )',
		borderRadius: '50%',
		w: 125,
		h: 4 
		},
	LASERBIG: {
		bg: 'linear-gradient( to right, rgba(255,30,15,0) 0%, rgba(255,30,15,1) 100% )',
		borderRadius: '50%',
		w: 225,
		h: 8 
		},
	WIDEBEAM: {
		bg: 'linear-gradient( to right, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 75%, rgba(255,255,255,1) 100% )',
		borderRadius: '30%',
		w: 400,
		h: 20 
		},
	KINETIC: {
		bg: 'rgb(50,120,240)',
		borderRadius: '50%',
		w: 30,
		h: 15 
		},
	SLIME: {
		bg: 'radial-gradient( closest-side at 80%, rgba(200,230,100,1) 0%,  rgba(200,230,100,1) 50%, transparent 60%, transparent 100% ), radial-gradient( rgba(100,230,100,0), rgba(100,230,100,1) )',
		borderRadius: '50%',
		w: 50,
		h: 35 
		},
	SLIMEBIG: {
		bg: 'radial-gradient( closest-side at 80%, rgba(200,230,100,1) 0%,  rgba(200,230,100,1) 50%, transparent 65%, transparent 100% ), radial-gradient( rgba(100,230,100,0), rgba(100,230,100,1) )',
		borderRadius: '50%',
		w: 70,
		h: 50 
		},
	MISSILE: { 
		bg: 'linear-gradient( to right, rgba(255,255,80,0) 0%, rgba(255,255,80,1) 100% )',
		w: 50,
		h: 12,
		borderRadius: '120%'
		},
	}
	
export const WeaponList = {
	MISSILE: {
		name: 'Missile',
		type: 'missile',
		desc: 'Self-powered vehicle delivers explosion on contact.',
		mindmg: 50,
		maxdmg: 75,
		shots: 3,
		reload: 5,
		accu: 0.8,
		cost: { labor:8, m:1, o:1 },
		mass: 5,
		fx: WeaponFX.MISSILE
		},
	RAYGUN: {
		name: 'Ray Gun',
		type: 'beam',
		desc: 'Heat ray fries targets.',
		mindmg: 80,
		maxdmg: 150,
		shots: 1,
		reload: 15,
		accu: 0.6,
		cost: { labor:6, m:1 },
		mass: 10,
		fx: WeaponFX.WIDEBEAM
		},
	LASER: {
		name: 'Laser',
		type: 'beam',
		desc: 'Focused beam attack lacerates target.',
		mindmg: 15,
		maxdmg: 20,
		shots: 8,
		reload: 4,
		accu: 0.9,
		cost: { labor:2, m:1 },
		mass: 4,
		fx: WeaponFX.DEFAULT
		},
	HEAVYLASER: {
		name: 'Heavy Laser',
		type: 'beam',
		desc: 'Focused beam attack lacerates target.',
		mindmg: 50,
		maxdmg: 80,
		shots: 3,
		reload: 4,
		accu: 0.8,
		cost: { labor:10, m:1 },
		mass: 6,
		fx: WeaponFX.LASERBIG
		},
	TURBOLASER: {
		name: 'Turbo Laser',
		type: 'beam',
		desc: 'Rapid fire beam weapon with low accuracy.',
		mindmg: 12,
		maxdmg: 21,
		shots: 16,
		reload: 2,
		accu: 0.6,
		cost: { labor:12, m:0.5 },
		mass: 6,
		fx: WeaponFX.LASERSMALL
		},
	SPACECANNON: {
		name: 'Space Cannon',
		type: 'kinetic',
		desc: 'Fires heavy metal spikes at high velocity.',
		mindmg: 25,
		maxdmg: 35,
		shots: 9,
		reload: 6,
		accu: 0.6, 
		cost: { labor:8, m:2, o:1 },
		mass: 20,
		fx: WeaponFX.KINETIC
		},
	BUCKSHOT: {
		name: 'Buckshot Blaster',
		type: 'kinetic',
		desc: 'Sprays targets near-light speed shrapnel.',
		mindmg: 5,
		maxdmg: 45,
		shots: 5,
		reload: 9,
		accu: 0.9,
		cost: { labor:5, m:2, o:1 },
		mass: 18,
		fx: WeaponFX.KINETIC
		},
	AMOEBASLIME1: {
		name: 'Amoeba Slime',
		type: 'missile',
		desc: 'Caustic attack that disintigrates metal.',
		mindmg: 20,
		maxdmg: 30,
		shots: 4,
		reload: 8,
		accu: 0.7,
		cost: {},
		mass: 30,
		fx: WeaponFX.SLIME
		},
	AMOEBASLIME2: {
		name: 'Heavy Amoeba Slime',
		type: 'missile',
		desc: 'Caustic attack that disintigrates metal.',
		mindmg: 40,
		maxdmg: 70,
		shots: 5,
		reload: 8,
		accu: 0.7,
		cost: {},
		mass: 40,
		fx: WeaponFX.SLIME
		},
	AMOEBASLIME3: {
		name: 'Terrible Amoeba Slime',
		type: 'missile',
		desc: 'Caustic attack that disintigrates metal.',
		mindmg: 100,
		maxdmg: 200,
		shots: 6,
		reload: 8,
		accu: 0.7,
		cost: {},
		mass: 50,
		fx: WeaponFX.SLIMEBIG
		}
	};

// add keys to objects themselves for later self-reference
for ( let k in WeaponList ) {
		WeaponList[k].tag = k;
		// also set a default effect
		if ( !WeaponList[k].hasOwnProperty('fx') ) { 
			WeaponList[k].fx = WeaponFX.DEFAULT;
			}
	}
