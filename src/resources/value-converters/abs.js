export class AbsValueConverter {
  toView( value ) {
    return value ? Math.abs( Number(value) ) : null;
  }
}
