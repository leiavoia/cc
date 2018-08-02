
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
		labor: 10,
		mass: 5
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
		labor: 10,
		mass: 10
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
		labor: 10,
		mass: 4
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
		labor: 10,
		mass: 6
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
		labor: 10,
		mass: 6
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
		labor: 10,
		mass: 20
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
		labor: 10,
		mass: 18
		},
	AMOEBASLIME1: {
		name: 'Amoeba Slime',
		type: 'missile',
		desc: 'Caustic attack that disintigrates metal.',
		mindmg: 20,
		maxdmg: 30,
		shots: 8,
		reload: 8,
		accu: 0.7,
		labor: 10,
		mass: 30
		},
	AMOEBASLIME2: {
		name: 'Heavy Amoeba Slime',
		type: 'missile',
		desc: 'Caustic attack that disintigrates metal.',
		mindmg: 40,
		maxdmg: 70,
		shots: 10,
		reload: 8,
		accu: 0.7,
		labor: 10,
		mass: 40
		},
	AMOEBASLIME3: {
		name: 'Terrible Amoeba Slime',
		type: 'missile',
		desc: 'Caustic attack that disintigrates metal.',
		mindmg: 100,
		maxdmg: 200,
		shots: 12,
		reload: 8,
		accu: 0.7,
		labor: 10,
		mass: 50
		}
	};

// add keys to objects themselves for later self-reference
for ( let k in WeaponList ) {
	if ( WeaponList.hasOwnProperty(k) ) {
		WeaponList[k].tag = k;
		}
	}
