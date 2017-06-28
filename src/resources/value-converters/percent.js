export class PercentValueConverter {
  toView( value, accu = 0 ) {
    return value ? ( value * 100 ).toFixed( accu ) : 0;
  }
}