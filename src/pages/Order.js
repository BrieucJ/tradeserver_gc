import React from 'react';
import { Container, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class Order extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      orders_demo: [],
      orders_real: [],
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
            orders_demo: response.p_demo.orders,
            orders_real: response.p_real.orders,
        })
      }
    })
  }

  total_profit = (order) => {
    if (order.position.close_rate === 0){
      return null
    } else {
      return (order.position.open_rate-order.position.close_rate)*order.position.num_of_shares
    }
  }

  render() {
    const orders = this.props.portfolio_type ? this.state.orders_real : this.state.orders_demo;
    const table_height = 'calc("100vh" - "100px")'
    return (
      <Container>
        <Grid container direction="column" alignItems="center" justify="center">
            <TableContainer component={Paper} style={{height: 'calc(100vh - 100px)'}}>
              <Table stickyHeader aria-label="simple table" >
                <TableHead>
                  <TableRow>
                    <TableCell align="right">Order type</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Total investment </TableCell>
                    <TableCell align="right"># of shares</TableCell>
                    <TableCell align="right">Total profit/loss</TableCell>
                    <TableCell align="right">created_at</TableCell>
                    <TableCell align="right">submited_at</TableCell>
                    <TableCell align="right">executed_at</TableCell>
                    <TableCell align="right">canceled_at</TableCell>
                    <TableCell align="right">terminated_at</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                  orders.map((order, index)=>{
                    if(index === 0 || new Date(order.order.created_at).getDay() !== new Date(orders[index-1].order.created_at).getDay()){
                      return(
                        <React.Fragment key={order.order.id}>
                          <TableRow>
                            <TableCell component="th" scope="row" align='center' colSpan={11}>{order.order.created_at.split('T')[0]} </TableCell>
                          </TableRow>
                          <TableRow hover key={order.order.id} onClick={() => {this.props.history.push('/position/?id='+order.position.id)}} >
                            <TableCell component="th" scope="row" style={{color: order.order.order_rate === undefined ? 'red' : 'green'}}>{order.order_rate === undefined ? 'SELL' : 'BUY'} </TableCell>
                            <TableCell component="th" scope="row">{order.order.stock.symbol} </TableCell>
                            <TableCell component="th" scope="row">{order.order.stock.name} </TableCell>
                            <TableCell align='right'>{order.position.total_investment.toFixed(2)} </TableCell>
                            <TableCell align='right'>{order.position.num_of_shares} </TableCell>
                            <TableCell align='right' style={{color: this.total_profit(order) === null ? 'white' : this.total_profit(order) > 0 ? 'green' : 'red'}} >{this.total_profit(order) === null ? 'n.a.' : this.total_profit(order).toFixed(2)} </TableCell>
                            <TableCell align='right'>{order.order.created_at === null ? '-' : new Date(order.order.created_at).toLocaleTimeString()} </TableCell>
                            <TableCell align='right'>{order.order.submited_at === null ? '-' : new Date(order.order.submited_at).toLocaleTimeString()} </TableCell>
                            <TableCell align='right'>{order.order.executed_at === null ? '-' : new Date(order.order.executed_at).toLocaleTimeString()} </TableCell>
                            <TableCell align='right'>{order.order.canceled_at === null || order.order.canceled_at === undefined ? '-' : new Date(order.order.canceled_at).toLocaleTimeString()} </TableCell>
                            <TableCell align='right'>{order.order.terminated_at === null || order.order.terminated_at === undefined ? '-' : new Date(order.order.terminated_at).toLocaleTimeString()} </TableCell>
                          </TableRow>
                        </React.Fragment>
                      )
                    } else {
                      return(
                        <TableRow hover key={order.order.id} onClick={() => {this.props.history.push('/position/?id='+order.position.id)}} >
                            <TableCell component="th" scope="row" style={{color: order.order.order_rate === undefined ? 'red' : 'green'}}>{order.order.order_rate === undefined ? 'SELL' : 'BUY'} </TableCell>
                            <TableCell component="th" scope="row">{order.order.stock.symbol} </TableCell>
                            <TableCell component="th" scope="row">{order.order.stock.name} </TableCell>
                            <TableCell align='right'>{order.position.total_investment.toFixed(2)} </TableCell>
                            <TableCell align='right'>{order.position.num_of_shares} </TableCell>
                            <TableCell align='right' style={{color: this.total_profit(order) === null ? 'white' : this.total_profit(order) > 0 ? 'green' : 'red'}} >{this.total_profit(order) === null ? 'n.a.' : this.total_profit(order).toFixed(2)} </TableCell>
                            <TableCell align='right'>{order.order.created_at === null ? '-' : new Date(order.order.created_at).toLocaleTimeString()} </TableCell>
                            <TableCell align='right'>{order.order.submited_at === null ? '-' : new Date(order.order.submited_at).toLocaleTimeString()} </TableCell>
                            <TableCell align='right'>{order.order.executed_at === null ? '-' : new Date(order.order.executed_at).toLocaleTimeString()} </TableCell>
                            <TableCell align='right'>{order.order.canceled_at === null || order.order.canceled_at === undefined ? '-' : new Date(order.order.canceled_at).toLocaleTimeString()} </TableCell>
                            <TableCell align='right'>{order.order.terminated_at === null || order.order.terminated_at === undefined ? '-' : new Date(order.order.terminated_at).toLocaleTimeString()} </TableCell>
                        </TableRow>
                      )
                    }
                  })}
                  </TableBody>
              </Table>
            </TableContainer>
          </Grid>
      </Container>
    ); 
  }
}
export default withStyles(styles, { withTheme: true })(Order);