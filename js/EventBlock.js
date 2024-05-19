class EventBlock {
    constructor(event) {
        this.event = event;
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

    positionBetween(startTime, endTime) {
        const timeRange = endTime - startTime;
        const startOffset = ((this.event.start_date - startTime) / timeRange) * 100;
        const duration = ((this.event.end_date - this.event.start_date) / timeRange) * 100;

        this.domElement.style.left = `${startOffset}%`;
        this.domElement.style.width = `${duration}%`;
    }
}

export default EventBlock;