export default function RandomName( maxlength=7 ) { 
	let ok = false;
	let str = '';
	while ( !ok ) { 
		str = '';
		// split into vowels and consenants.
		// extra letters pad the probabilities a little bit.
		let parts = [
			['d','k','l','n','p','r','s','t','b','c','d','h','k','l','m','n','p','r','s','t','v','w','b','c','d','e','f','g','h','j','k','l','m','n','p','q','r','s','t','v','w','x','y','sh','th','zh','n'],
			['a','e','i','o','u','a','e','i','o','a']
			];
		// this uses a simple markov-chain 2-state machine.
		// a beautiful solution to random name generation.
		// see: http://setosa.io/ev/markov-chains/
		let state = 0;
		// pick a random maximum number of letter-parts for this name
		let num_parts = Math.floor(Math.random()*(maxlength-1))+1;
		// foreach part
		for ( let i=0; i <= num_parts;  i++ ) {
			// prefer to start words with a consenent more often than not
			if ( !i && Math.random() >= 0.20 ) { state = 0; }
			// switch the state machine. The magic numbers here give 
			// decent names for stars
			else if ( state == 0 && Math.random() >= 0.20 ) { state = 1; }
			else if ( state == 1 && Math.random() >= 0.28 ) { state = 0; }
			str = str + parts[state][  Math.floor(Math.random()*parts[state].length)  ]; 
			}
		// remove idiotic repeating letters
		str = str.replace(/(.)\1+/gi, "$1", str);
		// check for nutsy combos
		if ( 
			str.length >= 4 
			&& !str.match(/[aeiou]{3}/) // 3 vowels in a row = bad
			&& !str.match(/[bcdfghjklmnpqrstvwxz]{3}/) // 3 consenants = bad
			// a few specific names we would really prefer to avoid
			&& !/fuck|fuq|fuk|shit|crap|cunt|dung|dick|butt|barf|poop|pee|piss|dang|fart|puke|loser/g.test(str)
			) { ok = true; }
		}
	return str;
	}
