export class RoundValueConverter {
  toView( value, accu = 0 ) {
    return value ? Number(value).toFixed( accu ) : 0;
  }
}
