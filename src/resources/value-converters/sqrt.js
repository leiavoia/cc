export class SqrtValueConverter {
  toView( value ) {
    return value ? Math.sqrt(value) : 0;
  }
}
