export class PropsValueConverter {
  toView( value ) {
    return value ? Object.keys( value ) : [];
  }
}
