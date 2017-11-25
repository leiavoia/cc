export class CommunicationAbilityValueConverter {
  toView( value ) {
    if ( !value ) { return 'None'; }
    if ( value < 0.3 ) { return 'Limited'; }
    if ( value < 1.0 ) { return 'Good'; }
    return 'Excellent';
  }
}
