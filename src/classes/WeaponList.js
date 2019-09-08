
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
		bg: 'rgb(150,20,240)',
		borderRadius: '50%',
		w: 20,
		h: 10 
		},
	KINETIC2: {
		bg: 'rgb(150,20,240)',
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
	TORPEDO: { 
		bg: 'linear-gradient( to right, rgba(255,50,10,0) 0%, rgba(255,50,10,1) 100% )',
		w: 60,
		h: 16,
		borderRadius: '120%'
		},
	}
	
export const WeaponList = {
	
	LASER: {
		name: 'Laser',
		type: 'beam',
		desc: 'Focused beam attack lacerates target.',
		mindmg: 15,
		maxdmg: 20,
		shots: 8,
		reload: 4,
		accu: 0.7,
		cost: { labor:2, m:1 },
		mass: 4,
		fx: WeaponFX.DEFAULT
		},
	LIGHTNINGSTRIKER: {
		name: 'Lightning Striker',
		type: 'beam',
		desc: 'Beam weapon.',
		mindmg: 5,
		maxdmg: 40,
		shots: 7,
		reload: 6,
		accu: 0.4,
		cost: { labor:4, m:1, s:0.5 },
		mass: 10,
		fx: WeaponFX.DEFAULT
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
		cost: { labor:7, m:0.5 },
		mass: 7,
		fx: WeaponFX.LASERSMALL
		},
	PULSECANNON: {
		name: 'Pulse Cannon',
		type: 'beam',
		desc: 'Beam weapon.',
		mindmg: 20,
		maxdmg: 30,
		shots: 12,
		reload: 3,
		accu: 0.8,
		cost: { labor:16, r:1 },
		mass: 12,
		fx: WeaponFX.LASERBIG
		},
	GRAVITONBEAM: {
		name: 'Graviton Beam',
		type: 'beam',
		desc: 'Beam weapon.',
		mindmg: 35,
		maxdmg: 65,
		shots: 5,
		reload: 7,
		accu: 1.2,
		cost: { labor:18, b:2 },
		mass: 20,
		fx: WeaponFX.LASERBIG
		},
	DISINTEGRATER: {
		name: 'Disintegration Beam',
		type: 'beam',
		desc: 'Beam weapon.',
		mindmg: 75,
		maxdmg: 150,
		shots: 7,
		reload: 4,
		accu: 0.9,
		cost: { labor:15, y:2 },
		mass: 40,
		fx: WeaponFX.WIDEBEAM
		},
	DESYNCHRONIZER: {
		name: 'Desynchronizer',
		type: 'beam',
		desc: 'Beam weapon.',
		mindmg: 400,
		maxdmg: 500,
		shots: 3,
		reload: 10,
		accu: 2.0,
		cost: { labor:20, v:1, c:1, y:1 },
		mass: 100,
		fx: WeaponFX.WIDEBEAM
		},
		
	// KINETIC WEAPONS
	SPACECANNON: {
		name: 'Space Cannon',
		type: 'kinetic',
		desc: 'Fires heavy metal spikes at high velocity.',
		mindmg: 25,
		maxdmg: 35,
		shots: 9,
		reload: 6,
		accu: 0.6, 
		cost: { labor:8, m:1, o:1 },
		mass: 20,
		fx: WeaponFX.KINETIC
		},
	BUCKSHOT: {
		name: 'Buckshot Blaster',
		type: 'kinetic',
		desc: 'Sprays targets with near-lightspeed shrapnel.',
		mindmg: 5,
		maxdmg: 45,
		shots: 5,
		reload: 9,
		accu: 0.9,
		cost: { labor:3, s:1 },
		mass: 18,
		fx: WeaponFX.KINETIC
		},
	RAILGUN: {
		name: 'Rail Gun',
		type: 'kinetic',
		desc: 'Kinetic weapon.',
		mindmg: 35,
		maxdmg: 50,
		shots: 4,
		reload: 7,
		accu: 0.7,
		cost: { labor:8, g:1 },
		mass: 25,
		fx: WeaponFX.KINETIC2
		},
	NEUTRONIUMGUN: {
		name: 'Neutronium Gun',
		type: 'kinetic',
		desc: 'Kinetic weapon.',
		mindmg: 50,
		maxdmg: 70,
		shots: 3,
		reload: 9,
		accu: 0.8,
		cost: { labor:14, b:1 },
		mass: 35,
		fx: WeaponFX.KINETIC2
		},
	ANTIMATTERCANNON: {
		name: 'Antimatter Cannon',
		type: 'kinetic',
		desc: 'Kinetic weapon.',
		mindmg: 85,
		maxdmg: 160,
		shots: 4,
		reload: 9,
		accu: 0.7,
		cost: { labor:12, c:1 },
		mass: 45,
		fx: WeaponFX.KINETIC2
		},
	KUGELBLITZER: {
		name: 'Kugelblitzer',
		type: 'kinetic',
		desc: 'Kinetic weapon.',
		mindmg: 200,
		maxdmg: 500,
		shots: 3,
		reload: 9,
		accu: 0.9,
		cost: { labor:20, y:1, c:1 },
		mass: 60,
		fx: WeaponFX.KINETIC2
		},
		
	// MISSILE / EXPLOSIVE WEAPONS
	MISSILE: {
		name: 'Cuncussion Missile',
		type: 'missile',
		desc: 'Self-powered vehicle delivers explosion on contact.',
		mindmg: 40,
		maxdmg: 35,
		shots: 3,
		reload: 8,
		accu: 0.7,
		cost: { labor:8, o:1 },
		mass: 8,
		fx: WeaponFX.MISSILE
		},
	NUCLEARMISSILE: {
		name: 'Nuclear Missile',
		type: 'missile',
		desc: 'Missile weapon.',
		mindmg: 50,
		maxdmg: 75,
		shots: 3,
		reload: 12,
		accu: 0.8,
		cost: { labor:20, m:1 },
		mass: 12,
		fx: WeaponFX.MISSILE
		},
	FUSIONMISSILE: {
		name: 'Fusion Missile',
		type: 'missile',
		desc: 'Missile weapon.',
		mindmg: 65,
		maxdmg: 100,
		shots: 2,
		reload: 12,
		accu: 0.9,
		cost: { labor:20, r:1  },
		mass: 15,
		fx: WeaponFX.MISSILE
		},
	VORTEXTORPEDO: {
		name: 'Vortex Torpedo',
		type: 'missile',
		desc: 'Missile weapon.',
		mindmg: 250,
		maxdmg: 400,
		shots: 2,
		reload: 16,
		accu: 1.1,
		cost: { labor:15, v:1, r:1 },
		mass: 50,
		fx: WeaponFX.TORPEDO
		},
	BLACKHOLETORPEDO: {
		name: 'Black Hole Torpedo',
		type: 'missile',
		desc: 'Missile weapon.',
		mindmg: 500,
		maxdmg: 1000,
		shots: 2,
		reload: 14,
		accu: 1.5,
		cost: { labor:25, v:2 },
		mass: 200,
		fx: WeaponFX.TORPEDO
		},
		
	// FLEET-WIDE WEAPONS
	SHEARWAVE: {
		name: 'Gravitonic Shearwave',
		type: 'unknown',
		desc: 'High-frequency gravity waves rip apart the very fabric of spacetime.',
		mindmg: 50,
		maxdmg: 75,
		shots: 3,
		reload: 5,
		accu: 0.8,
		cost: { labor:8, m:1, o:1 },
		mass: 5,
		fx: WeaponFX.WIDEBEAM
		},
	DIMSHIFTER: {
		name: 'Dimensional Shifter',
		type: 'cluster',
		desc: 'Randomly shifts targets out of existance.',
		mindmg: 50,
		maxdmg: 75,
		shots: 3,
		reload: 5,
		accu: 0.8,
		cost: { labor:8, m:1, o:1 },
		mass: 5,
		fx: WeaponFX.WIDEBEAM
		},
	VANISHER: {
		name: 'Vanisher',
		type: 'cluster',
		desc: 'Reliably shifts targets out of existance.',
		mindmg: 50,
		maxdmg: 75,
		shots: 3,
		reload: 5,
		accu: 0.8,
		cost: { labor:8, m:1, o:1 },
		mass: 5,
		fx: WeaponFX.WIDEBEAM
		},
				
	// MONSTER WEAPONS / NON-RESEARCHABLE
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
		},
		
		
		
		
	// TO BE REMOVED
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
					
	};

// add keys to objects themselves for later self-reference
for ( let k in WeaponList ) {
		WeaponList[k].tag = k;
		// also set a default effect
		if ( !WeaponList[k].hasOwnProperty('fx') ) { 
			WeaponList[k].fx = WeaponFX.DEFAULT;
			}
	}
