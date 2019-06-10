export class FloorValueConverter {
  toView( value ) {
    return value ? Math.floor( Number(value) ) : 0;
  }
}
