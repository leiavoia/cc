export class UppercaseFirstValueConverter {
  toView( value ) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
