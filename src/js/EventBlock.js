import TimelineBlock from "./TimelineBlock.js";

class EventBlock extends TimelineBlock {
    constructor(event, onSelect = null) {
        super();
        this.event = event;
        this.startDate = event.start_date;
        this.endDate = event.end_date;
        this.title = event.title;
        this.link = event.link;
        this.onSelect = onSelect;
        this.domElement = this.render();

        this.event.onFavouriteChange = (isFav) => this.updateFavouriteStatus(isFav);
        
        // don't bother running updateFavouriteStatus on initialisation
    }

    render() {
        const eventElement = document.createElement('button');
        eventElement.type = 'button';
        eventElement.className = 'event-block';
        eventElement.classList.add('timeline-block');
        eventElement.innerText = this.title;
        eventElement.addEventListener('click', () => this.onSelect?.(this.event));

        return eventElement;
    }

    updateFavouriteStatus(isFav) {
        this.domElement.classList[isFav ? 'add' : 'remove']('fav');
    }
}

export default EventBlock;