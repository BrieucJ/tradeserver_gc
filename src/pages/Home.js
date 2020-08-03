import React from 'react';
import { Container, Grid, Button, Typography, CircularProgress, Paper} from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';
import Area_Chart from '../components/AreaChart'
import Pie_Chart from '../components/PieChart'

const styles = {

}

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading:false,
      last_price_date: null,
      last_order_date: null,
      last_portfolio_date: null,
      last_submited_order_date: null,
      p_demo: {},
      p_real: {}
    };
  }

  componentWillMount = () => {
    this.setState({loading:true})
  }

  componentDidMount = () => {
    this.retrieveHome()
  }

  retrieveHome = () => {
    get('api/home/').then((resp) => {
      if (resp.status === 200){
        console.log(resp)
        var response = JSON.parse(resp.response)
        console.log(response)
        this.setState({
          p_demo: response.p_demo,
          p_real: response.p_real,
          loading: false
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

  renderPerformance(){
    if(this.props.portfolio_type) {
      if (this.state.p_real.p_history !== undefined){
        var start_balance = this.state.p_real.p_history[0].cash + this.state.p_real.p_history[0].total_invested_value
        var last_balance = this.state.p_real.p_history[this.state.p_real.p_history.length-1].cash + this.state.p_real.p_history[this.state.p_real.p_history.length-1].total_invested_value
        console.log(start_balance)
        console.log(last_balance)
      } else {
        return undefined
      }
    } else {
      if (this.state.p_demo.p_history !== undefined){
        var start_balance = this.state.p_demo.p_history[0].cash + this.state.p_demo.p_history[0].total_invested_value
        var last_balance = this.state.p_demo.p_history[this.state.p_demo.p_history.length-1].cash + this.state.p_demo.p_history[this.state.p_demo.p_history.length-1].total_invested_value
        return `${((last_balance/start_balance-1)*100).toFixed(2)}%`
      } else {
        return undefined
      }

    }
  }

  render() {
    const { classes, theme } = this.props;
    if (this.state.loading){
      return(<Container><CircularProgress color='primary' /></Container>)
    } else {
      return (
        <Container style={{flexGrow: 1}}>
          <Grid   container direction="row">
            <Grid item  xs={12} sm={6} >
              <Paper>
              <Typography variant='h4'>
                Summary
              </Typography>
              <Typography variant='body1'>
                Portfolio type: {this.props.portfolio_type ? 'REAL' : 'DEMO'}
              </Typography>
              <Typography variant='body1'>
                Creation date: {this.props.portfolio_type ? this.state.p_real.p_history[0].created_at.split('T')[0] : this.state.p_demo.p_history[0].created_at.split('T')[0]}
              </Typography>
              <Typography variant='body1'>
                Total cash: {this.props.portfolio_type ? this.state.p_real.portfolio.last_portfolio_history.cash.toLocaleString(undefined, {maximumFractionDigits: 0 }) : this.state.p_demo.portfolio.last_portfolio_history.cash.toLocaleString(undefined, {maximumFractionDigits: 0 }) }
              </Typography>
              <Typography variant='body1'>
                Total investments: {this.props.portfolio_type ? this.state.p_real.portfolio.last_portfolio_history.total_invested_value.toLocaleString(undefined, {maximumFractionDigits: 0 }) : this.state.p_demo.portfolio.last_portfolio_history.total_invested_value.toLocaleString(undefined, {maximumFractionDigits: 0 }) }
              </Typography>
              <Typography variant='body1'>
                Currency: {this.props.portfolio_type ? this.state.p_real.portfolio.currency : this.state.p_demo.portfolio.currency}
              </Typography>
              <Typography variant='body1' style={{paddingBottom:10}}>
                Performance to date: {this.renderPerformance()}
              </Typography>
                <Area_Chart data={this.area_chart_data()} />
              </Paper>

            </Grid>
            <Grid item container xs={12} sm={6}>
              <Paper>
              <Typography variant='h4'>
                Portfolio
              </Typography>
              <Pie_Chart data={this.pie_chart_data()} />
              </Paper>
            </Grid>
            <Grid item container xs={12} sm={6}>
              <Paper>
              <Typography variant='h4'>
                Buttons
              </Typography>
                <Button variant="contained" color="primary" onClick={()=>{this.update_prices()}} style={{margin:5}}>
                Update Prices
                </Button>
                <Button variant="contained" color="primary" onClick={()=>{this.update_portfolio()}} style={{margin:5}}>
                Update Portfolio
              </Button>
              <Button variant="contained" color="primary" onClick={()=>{this.update_orders()}} style={{margin:5}}>
              Update Orders
            </Button>
            <Button variant="contained" color="primary" onClick={()=>{this.transmit_orders()}} style={{margin:5}}>
              Transmit Orders
            </Button>
              </Paper>
            </Grid>
            
            </Grid>
        </Container>
      ); 
    }
  }
}

export default withStyles(styles, { withTheme: true })(Home);