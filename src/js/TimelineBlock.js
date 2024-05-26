class TimelineBlock {
    constructor() {
        
    }

    positionBetween(startTime, endTime) {
        const timeRange = endTime - startTime;
        const startOffset = ((this.startDate - startTime) / timeRange) * 100;
        const duration = ((this.endDate - this.startDate) / timeRange) * 100;

        this.domElement.style.left = `${startOffset}%`;
        this.domElement.style.width = `${duration}%`;
    }
}

export default TimelineBlock;
