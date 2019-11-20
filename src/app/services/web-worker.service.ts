import {Injectable} from '@angular/core';
import {Subject, Subscription, fromEvent, Observable} from 'rxjs';
import {WorkerMessage} from '../../web-worker/app-workers/shared/worker-message.model';
import {Logger} from './logger/logger';

@Injectable({
    providedIn: 'root'
})
export class WebWorkerService{
    // 指明worker文件位置
    public readonly workerPath = 'assets/workers/main.js';

    workerUpdate$: Observable<WorkerMessage>;
    private worker: Worker;
    public workerSubject: Subject<WorkerMessage>
    private workerMessageSubscription: Subscription;

    constructor(private logger: Logger) {
        this.workerInit();
    }

    doWork(workerMessage: WorkerMessage) {
        if (this.worker) {
            this.worker.postMessage(workerMessage);
        }
    }

    workerInit(): void {
        if (!!this.worker === false) {
            this.worker = new Worker(this.workerPath);
            this.workerSubject = new Subject<WorkerMessage>();
            this.workerUpdate$ = this.workerSubject.asObservable();

            this.workerMessageSubscription = fromEvent(this.worker,  'message')
                .subscribe(
                    (res: MessageEvent) => { // MessageEvent
                        if (this.workerSubject) {
                            this.workerSubject.next(WorkerMessage.getInstance(res.data));
                        }

                    },
                    err => {
                        this.logger.error('workerMessageSubscription subscription error: ', err);
                    }
                )
        }
    }
}
