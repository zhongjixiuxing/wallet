import {AppWorkers} from './app-workers/app.workers';

export const worker = new AppWorkers(self);

self.addEventListener('message',function ($event) {
    worker.workerBroker($event);
});