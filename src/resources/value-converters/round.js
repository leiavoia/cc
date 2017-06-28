export class RoundValueConverter {
  toView( value, accu = 0 ) {
    return value ? value.toFixed( accu ) : 0;
  }
}
