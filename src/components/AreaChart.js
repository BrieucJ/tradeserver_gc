import React from 'react';
import { AreaChart, Area, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Container } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class Area_Chart extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 

    };
  }

  render() {
    const { classes, theme } = this.props;
    return (
    <AreaChart width={600} height={400} data={this.props.data} >
        <CartesianGrid strokeDasharray="3 3"/>
        <XAxis dataKey="name" />
        <YAxis/>
        <Tooltip />
        <Area type='monotone' dataKey='cash' stackId='1' stroke={theme.palette.type === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light} fill={theme.palette.type === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light} />
    </AreaChart>
    ); 
  }
}

export default withStyles(styles, { withTheme: true })(Area_Chart);
