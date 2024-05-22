import TimelineBlock from "./TimelineBlock.js";

class EventBlock extends TimelineBlock {
    constructor(event) {
        super();
        this.event = event;
        this.startDate = event.start_date;
        this.endDate = event.end_date;
        this.title = event.title;
        this.isFav = Math.random() < 0.2; // random favs for now
        this.link = event.link;
        this.domElement = this.render();
    }

    render() {
        const eventElement = document.createElement('a');
        eventElement.href = this.link;
        eventElement.target = '_blank';
        eventElement.className = 'event-block';
        eventElement.classList.add('timeline-block');
        if (this.isFav) {
            eventElement.classList.add('fav');
        }
        eventElement.innerText = this.title;

        return eventElement;
    }
}

export default EventBlock;