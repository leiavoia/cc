export class CeilValueConverter {
  toView( value ) {
    return value ? Math.ceil( Number(value) ) : 0;
  }
}
