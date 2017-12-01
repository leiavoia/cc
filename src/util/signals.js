import {EventAggregator} from 'aurelia-event-aggregator';

const bus = new EventAggregator();    

export function Send(type,data=null) {
  bus.publish(type,data);
}

export function Listen( type, callback) {
  return bus.subscribe(type, callback);
}
