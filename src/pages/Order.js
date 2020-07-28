import React, {Fragment} from 'react';
import { Container, Switch, Typography, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class Order extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      pending_buy_order_demo: [],
      pending_sell_order_demo: [],
      pending_buy_order_real: [],
      pending_sell_order_real: [],
    };
  }

  componentDidMount() {
    this.retrieve_order()
  }

  retrieve_order = async () => {
    console.log('retrieve_order')
    get('api/retrieve_order/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        console.log(response)
        this.setState({
            pending_buy_order_demo: response.p_demo.pending_buy_orders,
            pending_sell_order_demo: response.p_demo.pending_sell_orders,
            pending_buy_order_real: response.p_real.pending_buy_orders,
            pending_sell_order_real: response.p_real.pending_sell_orders,
        })
      }
    })
  }

  renderBuyOrders = () => {
    var buy_orders = []
    if (this.props.portfolio_type) {
      buy_orders = this.state.pending_buy_order_real
    } else {
      buy_orders = this.state.pending_buy_order_demo
    }
      return(
        buy_orders.map((buy_order) => (
            <TableRow key={buy_order.id}>
              <TableCell component="th" scope="row">{buy_order.stock.symbol} </TableCell>
              <TableCell align="right" style={{color:'green'}}> BUY </TableCell>
              <TableCell align="right">{Math.round(buy_order.total_investment)}</TableCell>
              <TableCell align="right">{Math.round(buy_order.num_of_shares)}</TableCell>
              <TableCell align="right">{Math.round(buy_order.order_rate)}</TableCell>
              <TableCell align="right">{Math.round(buy_order.current_rate)}</TableCell>
              <TableCell align="right">{Math.round(buy_order.stop_loss)}</TableCell>
              <TableCell align="right">{Math.round(buy_order.take_profit)}</TableCell>
              <TableCell align="right"> {buy_order.price_date === null ? 'N.A.' : new Date(buy_order.price_date).toLocaleString({timeZoneName:'short'})} </TableCell>
              <TableCell align="right"> {new Date(buy_order.created_at).toLocaleString({timeZoneName:'short'})} </TableCell>
              <TableCell align="right"> {buy_order.submited_at === null ? 'Not sent' : new Date(buy_order.submited_at).toLocaleString({timeZoneName:'short'})} </TableCell>
            </TableRow>
        ))
    )
  }

  renderSellOrders = () => {
    var sell_orders = []
    if (this.props.portfolio_type) {
      sell_orders = this.state.pending_sell_order_real
    } else {
      sell_orders = this.state.pending_sell_order_demo
    }
    return(
      sell_orders.map((sell_order) => (
          <TableRow key={sell_order.id}>
            <TableCell component="th" scope="row">{sell_order.stock.symbol} </TableCell>
            <TableCell align="right" style={{color:'red'}}> SELL </TableCell>
            <TableCell align="right">{Math.round(sell_order.position.total_investment)}</TableCell>
            <TableCell align="right">{Math.round(sell_order.position.num_of_shares)}</TableCell>
            <TableCell align="right">Market order</TableCell>
            <TableCell align="right">{Math.round(sell_order.position.current_rate)}</TableCell>
            <TableCell align="right">{Math.round(sell_order.position.stop_loss_rate)}</TableCell>
            <TableCell align="right">{Math.round(sell_order.position.take_profit_rate)}</TableCell>
            <TableCell align="right"> {sell_order.sma_position === null ? 'N.A.' : new Date(sell_order.sma_position.price_date).toLocaleString({timeZoneName:'short'})} </TableCell>
            <TableCell align="right"> {new Date(sell_order.created_at).toLocaleString({timeZoneName:'short'})} </TableCell>
            <TableCell align="right"> {sell_order.submited_at === null ? 'Not sent' : new Date(sell_order.submited_at).toLocaleString({timeZoneName:'short'})} </TableCell>
          </TableRow>
      ))
    )
  }


  render() {
    const { classes, theme } = this.props;
    return (
      <Container>
        <Grid  container direction="column" alignItems="center" justify="center">
        <Typography variant="h4" style={{margin:5}}>
            {this.props.portfolio_type && 'Real orders'}
            {!this.props.portfolio_type && 'Demo orders'}
        </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="simple table" >
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell align="right">Order type </TableCell>
                    <TableCell align="right">Total investment </TableCell>
                    <TableCell align="right"># of shares</TableCell>
                    <TableCell align="right">Open rate</TableCell>
                    <TableCell align="right">Current rate</TableCell>
                    <TableCell align="right">Stop loss</TableCell>
                    <TableCell align="right">Take profit</TableCell>
                    <TableCell align="right">Price date</TableCell>
                    <TableCell align="right">Creation date</TableCell>
                    <TableCell align="right">Sent date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {this.renderSellOrders()}
                  {this.renderBuyOrders()}
                  </TableBody>
              </Table>
            </TableContainer>
          </Grid>
      </Container>
    ); 
  }
}
export default withStyles(styles, { withTheme: true })(Order);