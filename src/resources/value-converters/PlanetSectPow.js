export class PlanetSectPowValueConverter {
  toView( value ) {
    let str = '▰';
    if ( value <= 0.25 ) { return str.repeat(1); }
    if ( value <= 0.50 ) { return str.repeat(2); }
    if ( value <= 0.75 ) { return str.repeat(3); }
    if ( value <= 1.00 ) { return str.repeat(4); }
    if ( value <= 1.25 ) { return str.repeat(5); }
    if ( value <= 1.50 ) { return str.repeat(6); }
    if ( value <= 1.75 ) { return str.repeat(7); }
    if ( value <= 2.00 ) { return str.repeat(7); }
    if ( value <= 2.50 ) { return str.repeat(8); }
    if ( value <= 3.00 ) { return str.repeat(9); }
    if ( value <= 4.00 ) { return str.repeat(10); }
    if ( value <= 5.00 ) { return str.repeat(11); }
    if ( value <= 6.00 ) { return str.repeat(12); }
    return str.repeat(13);
  }
}
