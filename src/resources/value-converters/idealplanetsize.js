export class IdealplanetsizeValueConverter {
  toView( value ) {
    return value ? Math.pow(value,0.72)*15 : 0;
  }
}
