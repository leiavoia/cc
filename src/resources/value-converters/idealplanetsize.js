export class IdealplanetsizeValueConverter {
  toView( value ) {
    return value ? Math.pow(value,0.72)*40 : 0;
  }
}
