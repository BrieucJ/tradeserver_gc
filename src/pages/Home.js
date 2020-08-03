import React from 'react';
import { Container, Grid, Button, Typography} from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';
import Area_Chart from '../components/AreaChart'
import Pie_Chart from '../components/PieChart'

const styles = {

}

const data = [{name: 'Page A', uv: 400, pv: 2400, amt: 2400}, {name: 'Page B', uv: 600, pv: 2400, amt: 2400}];

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      last_price_date: null,
      last_order_date: null,
      last_portfolio_date: null,
      last_submited_order_date: null,
      p_demo: {},
      p_real: {}
    };
  }

  componentDidMount = () => {
    this.retrieveHome()
  }

  retrieveHome = () => {
    get('api/home/').then((resp) => {
      console.log(resp)
      if (resp.status === 200){
        console.log(resp)
        var response = JSON.parse(resp.response)
        console.log(response)
        this.setState({
          p_demo: response.p_demo,
          p_real: response.p_real
        })
      }
    })
  }

  update_prices = async () => {
    get('api/update_price_history/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
      }
    })
  }

  update_orders = async () => {
    get('api/update_orders/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
      }
    })
  }

  transmit_orders = async () => {
    get('api/transmit_orders/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
      }
    })
  }

  update_portfolio = async () => {
    get('api/update_portfolio/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
      }
    })
  }

  pie_chart_data = () => {
    var data = []
    if (this.props.portfolio_type) {
      if (this.state.p_real.current_positions !== undefined){
        for (let i = 0; i < this.state.p_real.current_positions.length; i++) {
          const value = this.state.p_real.current_positions[i].total_investment
          const name = `${this.state.p_real.current_positions[i].stock.symbol} | ${this.state.p_real.current_positions[i].stock.name.substring(0,10)}`
          const item = {'name': name, 'value': value}
          data.push(item)
        }
      }
    } else {
      if (this.state.p_demo.current_positions !== undefined){
        for (let i = 0; i < this.state.p_demo.current_positions.length; i++) {
          const value = this.state.p_demo.current_positions[i].total_investment
          const name = `${this.state.p_demo.current_positions[i].stock.symbol} | ${this.state.p_demo.current_positions[i].stock.name.substring(0,10)}`
          const item = {'name': name, 'value': value}
          data.push(item)
        }
      }
    }
    return data
  }

  area_chart_data = () => {
    var data = []

    if (this.props.portfolio_type) {
      if (this.state.p_real.p_history !== undefined){
        for (let i = 0; i < this.state.p_real.p_history.length; i++) {
          const cash = this.state.p_real.p_history[i].cash
          const name = new Date(this.state.p_real.p_history[i].created_at).toLocaleString({timeZoneName:'short'})
          const item = {'name': name, 'cash': cash}
          data.push(item)
        }
      }
    } else {
      if (this.state.p_demo.p_history !== undefined){
        for (let i = 0; i < this.state.p_demo.p_history.length; i++) {
          const cash = this.state.p_demo.p_history[i].cash
          const name = new Date(this.state.p_demo.p_history[i].created_at).toLocaleString({timeZoneName:'short'})
          const item = {'name': name, 'cash': cash}
          data.push(item)
        }
      }
    }
    return data
  }


  render() {
    const { classes, theme } = this.props;
    return (
      <Container>

        <Area_Chart data={this.area_chart_data()} />
        <Pie_Chart data={this.pie_chart_data()} />

        <Grid container direction="column" alignItems="center" justify="center">
          <Grid container item direction="row" alignItems="center" justify="center">
            <Typography variant='h6' >
              {this.state.last_price_date}
            </Typography>
            <Button variant="contained" color="primary" onClick={()=>{this.update_prices()}} style={{margin:5}}>
              Update Prices
            </Button>
          </Grid>
          <Grid container item direction="row" alignItems="center" justify="center">
            <Typography variant='h6' >
            {this.state.last_portfolio_date === null ? 'None' : new Date(this.state.last_portfolio_date).toISOString().split('T')[0]}
            </Typography>
            <Button variant="contained" color="primary" onClick={()=>{this.update_portfolio()}} style={{margin:5}}>
              Update Portfolio
            </Button>
          </Grid>
          <Grid container item direction="row" alignItems="center" justify="center">
            <Typography variant='h6' >
              {this.state.last_order_date === null ? 'None' : new Date(this.state.last_order_date).toISOString().split('T')[0]}
            </Typography>
            <Button variant="contained" color="primary" onClick={()=>{this.update_orders()}} style={{margin:5}}>
              Update Orders
            </Button>
          </Grid>
          <Grid container item direction="row" alignItems="center" justify="center">
            <Typography variant='h6' >
              {this.state.last_submited_order_date === null ? 'None' : new Date(this.state.last_submited_order_date).toISOString().split('T')[0]}
            </Typography>
            <Button variant="contained" color="primary" onClick={()=>{this.transmit_orders()}} style={{margin:5}}>
              Transmit Orders
            </Button>
          </Grid>
        </Grid>
      </Container>
    ); 
  }
}

export default withStyles(styles, { withTheme: true })(Home);