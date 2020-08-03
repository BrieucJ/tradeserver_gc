import React from 'react';
import { Container, Grid, Button, Typography, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';
import Area_Chart from '../components/AreaChart'
import Pie_Chart from '../components/PieChart'

const styles = {

}

function dynamicSort(property) {
  var sortOrder = 1;
  if(property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
  }
  return function (a,b) {
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * sortOrder;
  }
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
          const total_invested_value = this.state.p_real.p_history[i].total_invested_value
          const name = new Date(this.state.p_real.p_history[i].created_at).toLocaleString({timeZoneName:'short'})
          const item = {'name': name, 'cash': cash, 'total_invested_value': total_invested_value}
          data.push(item)
        }
      }
    } else {
      if (this.state.p_demo.p_history !== undefined){
        for (let i = 0; i < this.state.p_demo.p_history.length; i++) {
          const cash = this.state.p_demo.p_history[i].cash
          const total_invested_value = this.state.p_demo.p_history[i].total_invested_value
          const name = this.state.p_demo.p_history[i].created_at.split('T')[0]
          const item = {'name': name, 'cash': cash, 'total_invested_value': total_invested_value}
          data.push(item)
        }
      }
    }
    return data
  }

  renderPerformance(){
    if(this.props.portfolio_type) {
      if (this.state.p_real.p_history.length !== 0){
        var start_balance = this.state.p_real.p_history[0].cash + this.state.p_real.p_history[0].total_invested_value
        var last_balance = this.state.p_real.p_history[this.state.p_real.p_history.length-1].cash + this.state.p_real.p_history[this.state.p_real.p_history.length-1].total_invested_value
      } else {
        return undefined
      }
    } else {
      if (this.state.p_demo.p_history.length !== 0){
        var start_balance = this.state.p_demo.p_history[0].cash + this.state.p_demo.p_history[0].total_invested_value
        var last_balance = this.state.p_demo.p_history[this.state.p_demo.p_history.length-1].cash + this.state.p_demo.p_history[this.state.p_demo.p_history.length-1].total_invested_value
        return `${((last_balance/start_balance-1)*100).toFixed(2)}%`
      } else {
        return undefined
      }

    }
  }

  renderBuyOrders(){
    if(this.props.portfolio_type) {
      var bos = this.state.p_real.pending_buy_orders.sort((a,b) => a.total_investment < b.total_investment ? 1 : -1).slice(0, 10)
      return(
      <TableContainer component={Paper}>
        <Table aria-label="simple table" >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Amount </TableCell>
              <TableCell align="right">Submited</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {bos.map((bo) => (
              <TableRow key={bo.id}>
                <TableCell component="th" scope="row">{bo.stock.name.substring(0,15)} </TableCell>
                <TableCell align="right"> {bo.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                <TableCell align="right"> {bo.submited_at === null ? 'Not sent' : bo.submited_at} </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    } else {
      var bos = this.state.p_demo.pending_buy_orders.sort((a,b) => a.total_investment < b.total_investment ? 1 : -1).slice(0, 10)
      return(
      <TableContainer component={Paper}>
        <Table aria-label="simple table" >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Amount </TableCell>
              <TableCell align="right">Submited</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {bos.map((bo) => (
              <TableRow key={bo.id}>
                <TableCell component="th" scope="row">{bo.stock.name.substring(0,15)} </TableCell>
                <TableCell align="right"> {bo.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                <TableCell align="right"> {bo.submited_at === null ? 'Not sent' : bo.submited_at} </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }
  }

  renderPortfolio(){
    if(this.props.portfolio_type) {
      var bos = this.state.p_real.current_positions.sort((a,b) => a.total_investment < b.total_investment ? 1 : -1).slice(0, 10)
      return(
      <TableContainer component={Paper}>
        <Table aria-label="simple table" >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Amount </TableCell>
              <TableCell align="right">Submited</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {bos.map((bo) => (
              <TableRow key={bo.id}>
                <TableCell component="th" scope="row">{bo.stock.name.substring(0,15)} </TableCell>
                <TableCell align="right"> {bo.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                <TableCell align="right"> {'TEST'} </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    } else {
      var bos = this.state.p_demo.current_positions.sort((a,b) => a.total_investment < b.total_investment ? 1 : -1).slice(0, 10)
      return(
      <TableContainer component={Paper}>
        <Table aria-label="simple table" >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Amount </TableCell>
              <TableCell align="right">Submited</TableCell>
              </TableRow>
          </TableHead>
          <TableBody>
            {bos.map((bo) => (
              <TableRow key={bo.id}>
                <TableCell component="th" scope="row">{bo.stock.name.substring(0,15)} </TableCell>
                <TableCell align="right"> {bo.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                <TableCell align="right"> {'TEST'} </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }
  }

  render() {
    const { classes, theme } = this.props;
    if (this.state.loading){
      return(<Container><CircularProgress color='primary' /></Container>)
    } else {
      return (
        <Container>
          <Grid container direction="row" spacing={2}>

            <Grid item  xs={12} sm={6} >
              <Paper style={{padding:5}}>
              <Typography variant='h4'>
                Summary
              </Typography>
              <Typography variant='body1'>
                Portfolio type: {this.props.portfolio_type ? 'REAL' : 'DEMO'}
              </Typography>
              <Typography variant='body1'>
                Creation date:  {this.props.portfolio_type ? 
                  this.state.p_real.p_history[0] !== undefined ? new Date(this.state.p_real.p_history[0].created_at).toLocaleString({timeZoneName:'short'}) : null 
                : this.state.p_real.p_history[0] !== undefined ? new Date(this.state.p_demo.p_history[0].created_at).toLocaleString({timeZoneName:'short'}) : null}
              </Typography>
              <Typography variant='body1'>
                Last update: {this.props.portfolio_type ? 
                  this.state.p_real.portfolio !== undefined ? new Date(this.state.p_real.portfolio.updated_at).toLocaleString({timeZoneName:'short'})  : null 
                : this.state.p_real.portfolio !== undefined ? new Date(this.state.p_demo.portfolio.updated_at).toLocaleString({timeZoneName:'short'}) : null}
              </Typography>
              <Typography variant='body1'>
                Total cash:  {this.props.portfolio_type ? 
                  this.state.p_real.portfolio.created_at !== null ? this.state.p_real.portfolio.last_portfolio_history.cash.toLocaleString(undefined, {maximumFractionDigits: 0 }) : null
                  : this.state.p_demo.portfolio.created_at !== null ? this.state.p_demo.portfolio.last_portfolio_history.cash.toLocaleString(undefined, {maximumFractionDigits: 0 }) : null }
              </Typography>
              <Typography variant='body1'>
                Total investments: {this.props.portfolio_type ? 
                  this.state.p_real.portfolio.created_at !== null ? this.state.p_real.portfolio.last_portfolio_history.total_invested_value.toLocaleString(undefined, {maximumFractionDigits: 0 }) : null
                  : this.state.p_demo.portfolio.created_at !== null ? this.state.p_demo.portfolio.last_portfolio_history.total_invested_value.toLocaleString(undefined, {maximumFractionDigits: 0 }) : null }
              </Typography>
              <Typography variant='body1'>
                Currency: {this.props.portfolio_type ? this.state.p_real.portfolio.currency : this.state.p_demo.portfolio.currency}
              </Typography>
              <Typography variant='body1' style={{paddingBottom:10}}>
                Performance to date: {this.renderPerformance()}
              </Typography>
              </Paper>
            </Grid>

            <Grid item container xs={12} sm={6}>
              <Paper style={{padding:5}}>
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

            <Grid item xs={12} sm={6} >
              <Paper style={{padding:5}}>
              <Typography variant='h4' style={{display: 'inline-block'}}> Portfolio <Typography variant='body1' style={{display: 'inline-block'}}> (top 10)</Typography> </Typography>
              {this.renderPortfolio()}
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} >
              <Paper style={{padding:5}}>
              <Typography variant='h4' style={{display: 'inline-block'}}> Buy orders <Typography variant='body1' style={{display: 'inline-block'}}> (top 10)</Typography> </Typography>
              {this.renderBuyOrders()}
              </Paper>
            </Grid>


            
            </Grid>
        </Container>
      ); 
    }
  }
}

export default withStyles(styles, { withTheme: true })(Home);