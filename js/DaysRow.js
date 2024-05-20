import TimelineBlock from "./TimelineBlock.js";

class DayBlock extends TimelineBlock {
    constructor(date) {
        super();
        this.startDate = date;

        this.endDate = new Date(date);
        this.endDate.setDate(this.endDate.getDate() + 1);

        this.domElement = this.render();
    }

    render() {
        const dayBlock = document.createElement('div');
        dayBlock.className = 'day';
        dayBlock.classList.add('timeline-block');
        dayBlock.innerText = this.startDate.toLocaleDateString('en-GB', { weekday: 'short' });

        // Generate a background color based on the day of the week
        dayBlock.style.backgroundColor = `hsla(${(this.startDate.getDay() * 60) % 360}, 50%, 50%, 0.5)`;
        return dayBlock;
    }
}

class DaysRow {
    constructor(startTime, endTime) {
      this.startTime = startTime;
      this.endTime = endTime;
      this.domElement = this.render();
    }
  
    render() {
      const daysRow = document.createElement('div');
      daysRow.className = 'timeline-days-row';
      daysRow.classList.add('timeline-row');
      
      // start with startTime. this may not be a full day
      let currentDate = new Date(this.startTime);

      // loop until we reach endTime
      while (currentDate < this.endTime) {
        const dayBlock = new DayBlock(currentDate);
        dayBlock.positionBetween(this.startTime, this.endTime);
        daysRow.appendChild(dayBlock.domElement);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return daysRow;
    }
    
  }

  export default DaysRow;