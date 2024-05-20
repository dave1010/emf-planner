import TimelineBlock from "./TimelineBlock.js";

class EventBlock extends TimelineBlock {
    constructor(event) {
        super();
        this.event = event;
        this.startDate = event.start_date;
        this.endDate = event.end_date;
        this.title = event.title;
        this.domElement = this.render();
    }

    render() {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-block';
        eventElement.classList.add('timeline-block');
        eventElement.innerText = this.title;

        return eventElement;
    }
}

export default EventBlock;