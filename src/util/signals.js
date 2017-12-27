import {EventAggregator} from 'aurelia-event-aggregator';

const bus = new EventAggregator();    

export function Send(type,data=null) {
  bus.publish(type,data);
}

// returns a subscription. 
// use subscription.dispose() to unsubscribe.
export function Listen( type, callback ) {
  return bus.subscribe(type, callback);
}
