import TimelineBlock from "./TimelineBlock.js";

class EventBlock extends TimelineBlock {
    constructor(event) {
        super();
        this.event = event;
        this.startDate = event.start_date;
        this.endDate = event.end_date;
        this.title = event.title;
        this.link = event.link;
        this.domElement = this.render();

        this.event.onFavouriteChange = (isFav) => this.updateFavouriteStatus(isFav);
        
        // don't bother running updateFavouriteStatus on initialisation
    }

    render() {
        const eventElement = document.createElement('a');
        eventElement.href = this.link;
        eventElement.target = '_blank';
        eventElement.className = 'event-block';
        eventElement.classList.add('timeline-block');
        eventElement.innerText = this.title;

        return eventElement;
    }

    updateFavouriteStatus(isFav) {
        this.domElement.classList[isFav ? 'add' : 'remove']('fav');
    }
}

export default EventBlock;