class Timeline {
    constructor(domElement, schedule) {
        this.domElement = domElement;
        this.schedule = schedule;
    }

    render() {
        // Implement the rendering logic here
        this.domElement.innerHTML = ''; // Clear the element
        this.schedule.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.textContent = `${event.time}: ${event.description}`;
            this.domElement.appendChild(eventElement);
        });
    }
}
