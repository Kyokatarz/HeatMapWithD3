const url = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'


fetch(url).then(response => response.json())
        .then(data =>{
    dataHandler(data);
    
})

function dataHandler(data){
    //Extracting datas
    const baseTemperature = data.baseTemperature;
    const monthlyVariance = data.monthlyVariance.map(d=> (d.variance)); 
    const convertedToDate = data.monthlyVariance.map( d => new Date(d.year, d.month-1))
    const years = data.monthlyVariance.map(d => d.year);
    const months = convertedToDate.map(d => d.getMonth());
    
    //Declaring constants
    const width = 5.5 * (data.monthlyVariance.length/12),
          height = 33 * 12,
          padding = 80;
    
    
    //Min, max data values
    const xMin = d3.min(years),
          xMax = d3.max(years),
          yMin = d3.min(months),
          yMax = d3.max(months),
          lowestTemperature = d3.min(monthlyVariance) < 0 ? (baseTemperature + d3.min(monthlyVariance)) : (baseTemperature - d3.min(monthlyVariance)),
          highestTemperature = d3.min(monthlyVariance) < 0 ? (baseTemperature - d3.min(monthlyVariance)) : (baseTemperature + d3.min(monthlyVariance));
            
    //Colors
    const colors = ['#468284','#39AEB2','#7CD2D5','#ADF4F7', //cool colors
                    '#EBF4EE', //neutral
                    '#8D5656','#F94A4A','#991B1B','#6F0707']; //hot colors
    //Functions
    const temperatureThreshhold = [];
    const temperature = [];
    for (let index = 0; index < 9; index ++){
        let temp = (highestTemperature - lowestTemperature) / 9,
            temp1= (lowestTemperature + temp * index) .toFixed(2),
            temp2= (lowestTemperature + temp * (index + 1)) .toFixed(2);
            
        temperatureThreshhold.push({
            t1: temp1,
            t2: temp2
        })
        
        temperature.push(temp1);
        if (index == 8){temperature.push(temp2)}
    }

    //X and Y Scales
    const xScale = d3.scaleLinear()
                    .domain([xMin, xMax])
                    .range([padding, width]);
    
    const yScale = d3.scaleLinear()
                    .domain([yMin, yMax])
                    .range([padding, height])
    
    const legendScale = d3.scaleLinear()
                    .domain([lowestTemperature.toFixed(1), highestTemperature.toFixed(1)])
                    .range([padding - 1, padding + 30*colors.length ])
    
    
    //Tooltip
    const tooltip = d3.select('#svgContainer')
        .append('div')
        .attr('id','tooltip')
        .attr('width', 300)
        .attr('height', 200)
        .attr('style','opacity:0')
    

    
    const svg = d3.select('#svgContainer')
                    .append('svg')
                    .attr('width', width+padding)
                    .attr('height', height+padding*2);
    
    
    
    svg.append('text')
        .text('Year') 
        .attr('class','label-year')
        .attr('x',width/2)
        .attr('y',padding+height-10)
    
    svg.append('text')
        .text('Monthly Global Land-Surface Temperature*')
        .attr('x', width/2-300)
        .attr('y', padding/2+10)
        .attr('id','title')
    
    svg.append('text')
        .text('*1753 - 2015: base temperature 8.6℃')
        .attr('x', width-200)
        .attr('y',height+padding+50)
        .attr('id','description')
    svg.append('text')
    svg.selectAll('nodes')
        .data(data.monthlyVariance)
        .enter()
        .append('rect')
        .attr('class','cell')
        .attr('data-month', (d,i) => convertedToDate[i].getMonth())
        .attr('data-year', (d,i) => convertedToDate[i].getFullYear())
        .attr('data-temp', (d,i)=> (baseTemperature + monthlyVariance[i]).toFixed(1))
        .attr('width',4)
        .attr('height',30)
        .attr('x', (d,i)=> xScale(convertedToDate[i].getFullYear()))
        .attr('y',(d,i) => yScale(convertedToDate[i].getMonth()))
        .attr('stroke','black')
        .attr('stroke-width',0.1)
        .attr('style', (d,i)=>{
        for (let index = 0;index<9;index++){
            let thisNodeTemperature = baseTemperature + monthlyVariance[i]
            if ((temperatureThreshhold[index].t1 < thisNodeTemperature || temperatureThreshhold[index].t1 == thisNodeTemperature) && thisNodeTemperature < temperatureThreshhold[index].t2){
                return 'fill: ' + colors[index];
                break;
            }
        }
    })
        .on('mouseover', (d,i) =>{
            
            tooltip.attr('style', 'transform: translate('+ (xScale(convertedToDate[i].getFullYear()) -50) +'px,' 
                                                            + (yScale(convertedToDate[i].getMonth())-60) + 'px)')
                
             .style('opacity',1)
             .attr('data-year',convertedToDate[i].getFullYear())
                      
            .html(() => {
                let date = new Date(0);
                let temp = monthlyVariance.map(d => {if (d>=0){
                    return "+" + d.toFixed(2);
                }
                    else return d.toFixed(2);                                
                })
                date.setMonth(months[i]);
                date.setYear(years[i]);
                return d3.timeFormat('%B %Y')(date) + '<br>' + (baseTemperature + monthlyVariance[i]).toFixed(1) + ' (' + temp[i] + ')\&#8451';
            })
        })
        .on('mouseout', d => {
        tooltip.attr('style','opacity:0')
    })
    
        //Create legends
    const legend = svg.append('g')
                        .attr('id','legend');
        legend.selectAll('legends')
            .data(colors)
            .enter()
            .append('rect')
            .attr('width',30)
            .attr('height',30)
            .attr('x', (d,i) => padding + (30 * i))
            .attr('y', height + padding)
            .attr('style',(d,i)=> 'fill: ' + colors[i])
            .attr('stroke','black')
            .attr('stroke-width',0.5)
    //Creating and calling Axes
    const yAxis = d3.axisLeft(yScale)
            .tickFormat(function(month){
        let date = new Date(0);
        date.setMonth(month);
        return d3.timeFormat('%B')(date);
    })  
            .tickSize(10,1);
            
    
    const xAxis = d3.axisBottom(xScale)
                    .tickFormat(d3.format('d'));
                    
    const legendAxis = d3.axisBottom(legendScale)
            .tickValues(temperature)
            .tickFormat(d3.format(',.1f'));
    
    svg.append('g')
        .attr('transform', 'translate(' + padding + ',15)')
        .attr('id','y-axis')
        .call(yAxis)
        
    
    svg.append('g')
        .attr('transform', 'translate(0, ' + (height + 30) + ')' )
        .attr('id','x-axis')
        .call(xAxis);
    
    svg.append('g')
        .attr('transform', 'translate(0, ' + (height + padding +30) + ')' )
        .call(legendAxis)
    
    
    
        
}

