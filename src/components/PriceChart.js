import React from 'react';
import { LineChart, Line, ReferenceLine, CartesianGrid, Legend, XAxis, YAxis, Tooltip } from 'recharts';
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class PriceChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 

    };
  }

  render() {
    const { theme, min, max, data } = this.props;
    return (
        <LineChart height={this.props.height} width={this.props.width} data={data} >
            <XAxis dataKey="name" fill={this.props.theme.palette.type === 'dark' ? this.props.theme.palette.common.white : this.props.theme.palette.common.black}/>
            <YAxis dataKey="close" domain={[Math.round(min*0.9), Math.round(max*1.1)]} fill={this.props.theme.palette.type === 'dark' ? this.props.theme.palette.common.white : this.props.theme.palette.common.black} />
            <Tooltip />
            <CartesianGrid/>
            <Line type="monotone" dataKey="close" stroke={this.props.theme.palette.type === 'dark' ? this.props.theme.palette.primary.light : this.props.theme.palette.primary.dark} strokeWidth={4}/>
            <Line type="monotone" dataKey={"high_sma - " + this.props.high_sma_val} stroke={this.props.theme.palette.type === 'dark' ? this.props.theme.palette.secondary.light : this.props.theme.palette.secondary.dark} strokeWidth={2}/>
            <Line type="monotone" dataKey={"low_sma - " + this.props.low_sma_val} stroke={this.props.theme.palette.type === 'dark' ? this.props.theme.palette.info.light : this.props.theme.palette.info.dark} strokeWidth={2}/>
            {this.props.open_date !== null && <ReferenceLine x={this.props.open_date.split('T')[0]} stroke="green" label={{ value: 'BOUGHT', fill: 'green' }}/>}
            {this.props.close_date !== null && <ReferenceLine x={this.props.close_date.split('T')[0]} stroke="red" label={{ value: 'SOLD', fill: 'red' }} />}
            <Legend />
        </LineChart>
    ); 
  }
}

export default withStyles(styles, { withTheme: true })(PriceChart);
