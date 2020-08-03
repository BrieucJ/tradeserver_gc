import React from 'react';
import { PieChart, Pie, Sector, Cell, Tooltip, Legend } from 'recharts';
import { Container, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class Pie_Chart extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
        active_index: 0
    };
  }

  onPieEnter = (data, index) => {
      this.setState({active_index: index})
  }

  renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <text x={cx} y={cy} dy={5} textAnchor="middle" fill={fill}>{payload.name.split('|')[0]}</text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/>
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={this.props.theme.palette.type === 'dark' ? this.props.theme.palette.common.white : this.props.theme.palette.common.black}>  {`${payload.name}`} </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill={this.props.theme.palette.type === 'dark' ? this.props.theme.palette.common.white : this.props.theme.palette.common.black}>
          {`${payload.value} (${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };
  

  render() {
    const { classes, theme } = this.props;
    const COLORS = ["#0d47a1", '#1565c0', '#1976d2', '#1e88e5', '#2196f3', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb']
        return (
            <PieChart width={600} height={300} style={{backgroundColor:'purple'}}>
                <Pie 
                    dataKey='value'
                    activeIndex={this.state.active_index}
                    activeShape={this.renderActiveShape} 
                    data={this.props.data}
                    cx={200} 
                    cy={200} 
                    innerRadius={50}
                    outerRadius={100} 
                    onMouseEnter={this.onPieEnter}
                >
                {
                    this.props.data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
                }
                </Pie>
           </PieChart>
        ); 
  }
}

export default withStyles(styles, { withTheme: true })(Pie_Chart);
