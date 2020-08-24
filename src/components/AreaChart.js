import React from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
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
    const { theme } = this.props;
    return (
    <AreaChart height={this.props.height*0.85} width={this.props.width*0.98} data={this.props.data} >
        <CartesianGrid strokeDasharray="3 3"/>
        <XAxis dataKey="name" fill={this.props.theme.palette.type === 'dark' ? this.props.theme.palette.common.white : this.props.theme.palette.common.black}/>
        <YAxis fill={this.props.theme.palette.type === 'dark' ? this.props.theme.palette.common.white : this.props.theme.palette.common.black} />
        <Tooltip />
        <Area type='monotone' dataKey='cash' stackId='1' stroke={theme.palette.type === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light} fill={theme.palette.type === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light} />
        <Area type='monotone' dataKey='total_invested_value' stackId='1' stroke={theme.palette.type === 'dark' ? theme.palette.secondary.dark : theme.palette.secondary.light} fill={theme.palette.type === 'dark' ? theme.palette.secondary.dark : theme.palette.secondary.light} />
    </AreaChart>
    ); 
  }
}

export default withStyles(styles, { withTheme: true })(Area_Chart);
