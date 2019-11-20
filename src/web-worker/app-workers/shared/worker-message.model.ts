
export class WorkerMessage {
    topic: string;
    data: any;
    id: string;  // job id

    constructor(topic: string, data: any, id: string = null) {
        this.topic = topic;
        this.data = data;
        this.id = id;
    }

    public static getInstance(value: any): WorkerMessage {
        const {topic, data} = value;

        return new WorkerMessage(topic, data);
    }
}
