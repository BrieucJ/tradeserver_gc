import React from 'react';
import { Container, Grid, Button, Typography} from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      last_price_date: null,
      last_order_date: null,
      last_portfolio_date: null,
      last_submited_order_date: null
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
            last_price_date: response.last_price_date,
            last_order_date: response.last_order_date,
            last_portfolio_date: response.last_portfolio_date,
            last_submited_order_date: response.last_submited_order_date
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

  render() {
    const { classes, theme } = this.props;
    return (
      <Container>
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