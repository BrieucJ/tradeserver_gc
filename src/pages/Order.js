import React from 'react';
import { Container, Hidden, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';
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

  order_status = (order) => {
    var buy_order = order.order.order_rate !== undefined
    var status = {}

    if(buy_order){
      //BUY ORDER
      if (order.order.position === null){
        var canceled = order.order.canceled_at !== null;
        var terminated = order.order.terminated_at !== null;
        var submited = order.order.submited_at !== null;
        var executed = submited && order.order.executed_at !== null;
        if (!submited){
          status = {'status': 'PENDING', 'color': 'orange'}
        }
        if (!executed){
          status = {'status': 'PENDING', 'color': 'orange'}
        }
        if (executed){
          status = {'status': 'EXECUTED', 'color': 'green'}
        }
        if (canceled){
          status = {'status': 'CANCELED', 'color': 'orange'}
        }
        if (terminated){
          status = {'status': 'CANCELED', 'color': 'orange'}
        }
      } else {
        var submited = order.order.submited_at !== null;
        var executed = submited && order.order.executed_at !== null;
        var in_portfolio = executed && !canceled && !terminated && order.order.position.close_date === null;
        var closed = order.order.position.close_date !== null;
        if (!submited){
          status = {'status': 'PENDING', 'color': 'orange'}
        }
        if (!executed){
          status = {'status': 'PENDING', 'color': 'orange'}
        }
        if (executed){
          status = {'status': 'EXECUTED', 'color': 'green'}
        }
        if (closed){
          status = {'status': 'EXECUTED', 'color': 'green'}
        }
      }
    } else {
      //SELL order
      if (order.order.submited_at === null && order.order.executed_at === null){
        status = {'status': 'PENDING', 'color': 'orange'}
      }
      if (order.order.submited_at !== null && order.order.executed_at === null){
        status = {'status': 'PENDING', 'color': 'orange'}
      }
      if (order.order.submited_at !== null && order.order.executed_at !== null){
        status = {'status': 'EXECUTED', 'color': 'green'}
      }
    }
    if (status === {}){
      status = {'status': 'ERROR', 'color': 'red'}
    }
    return status
  }

  render() {
    const orders = this.props.portfolio_type ? this.state.orders_real : this.state.orders_demo;
    const table_height = 'calc("100vh" - "100px")'
    return (
        <Grid container spacing={0} direction="column" alignItems="center" justify="center" >
          <Grid item xs={12} sm={10}>
            <TableContainer component={Paper} style={{height: 'calc(100vh - 100px)'}}>
              <Table size='small' stickyHeader aria-label="orders table">
                <TableHead>
                  <TableRow>
                    <TableCell align="right">Order type</TableCell>
                    <TableCell>Symbol</TableCell>
                    <Hidden smDown>
                      <TableCell>Name</TableCell>
                    </Hidden>
                      <TableCell align="right">Total investment </TableCell>
                    <Hidden smDown>
                      <TableCell align="right"># of shares</TableCell>
                      <TableCell align="right">created_at</TableCell>
                      <TableCell align="right">submited_at</TableCell>
                      <TableCell align="right">executed_at</TableCell>
                      <TableCell align="right">canceled_at</TableCell>
                      <TableCell align="right">terminated_at</TableCell>
                    </Hidden>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                  orders.map((order, index)=>{
                    var status = this.order_status(order)
                    if(index === 0 || new Date(order.order.created_at).getDay() !== new Date(orders[index-1].order.created_at).getDay()){
                      return(
                        <React.Fragment key={order.order.id}>
                          <TableRow>
                            <TableCell component="th" scope="row" align='center' colSpan={11} style={{fontWeight:'bold'}}>{order.order.created_at.split('T')[0]} </TableCell>
                          </TableRow>
                          <TableRow hover key={order.order.id} onClick={() => {order.position !== null && this.props.history.push('/position/?id='+order.position.id)}} >
                            <TableCell component="th" scope="row" style={{color: order.order.order_rate === undefined ? 'red' : 'green'}}>{order.order.order_rate === undefined ? 'SELL' : 'BUY'} </TableCell>
                            <TableCell component="th" scope="row">{order.order.stock.symbol} </TableCell>
                            <Hidden smDown>
                              <TableCell component="th" scope="row" style={{display:'block', overflow: 'hidden',  whiteSpace:'nowrap', textOverflow:'ellipsis'}}>{order.order.stock.name} </TableCell>   
                            </Hidden>          
                            <TableCell align='right'>{order.order.order_rate === undefined ? order.position.total_investment.toFixed(1) : order.order.total_investment.toFixed(1)} </TableCell>
                            <Hidden smDown>
                              <TableCell align='right'>{order.order.order_rate === undefined ? order.position.num_of_shares : order.order.num_of_shares} </TableCell>
                              <TableCell align='right'>{order.order.created_at === null ? '-' : new Date(order.order.created_at).toLocaleTimeString()} </TableCell>
                              <TableCell align='right'>{order.order.submited_at === null ? '-' : new Date(order.order.submited_at).toLocaleTimeString()} </TableCell>
                              <TableCell align='right'>{order.order.executed_at === null ? '-' : new Date(order.order.executed_at).toLocaleTimeString()} </TableCell>
                              <TableCell align='right'>{order.order.canceled_at === null || order.order.canceled_at === undefined ? '-' : new Date(order.order.canceled_at).toLocaleTimeString()} </TableCell>
                              <TableCell align='right'>{order.order.terminated_at === null || order.order.terminated_at === undefined ? '-' : new Date(order.order.terminated_at).toLocaleTimeString()} </TableCell>
                            </Hidden>
                            <TableCell align='right' style={{color: status['color']}}> {status['status']} </TableCell>
                          </TableRow>
                        </React.Fragment>
                      )
                    } else {
                      return(
                      <TableRow hover key={order.order.id} onClick={() => {order.position !== null && this.props.history.push('/position/?id='+order.position.id)}} >
                        <TableCell component="th" scope="row" style={{color: order.order.order_rate === undefined ? 'red' : 'green'}}>{order.order.order_rate === undefined ? 'SELL' : 'BUY'} </TableCell>
                        <TableCell component="th" scope="row">{order.order.stock.symbol} </TableCell>
                        <Hidden smDown>
                          <TableCell component="th" scope="row" style={{display:'block', overflow: 'hidden',  whiteSpace:'nowrap', textOverflow:'ellipsis'}}>{order.order.stock.name} </TableCell>   
                        </Hidden>          
                        <TableCell align='right'>{order.order.order_rate === undefined ? order.position.total_investment.toFixed(1) : order.order.total_investment.toFixed(1)} </TableCell>
                        <Hidden smDown>
                          <TableCell align='right'>{order.order.order_rate === undefined ? order.position.num_of_shares : order.order.num_of_shares} </TableCell>
                          <TableCell align='right'>{order.order.created_at === null ? '-' : new Date(order.order.created_at).toLocaleTimeString()} </TableCell>
                          <TableCell align='right'>{order.order.submited_at === null ? '-' : new Date(order.order.submited_at).toLocaleTimeString()} </TableCell>
                          <TableCell align='right'>{order.order.executed_at === null ? '-' : new Date(order.order.executed_at).toLocaleTimeString()} </TableCell>
                          <TableCell align='right'>{order.order.canceled_at === null || order.order.canceled_at === undefined ? '-' : new Date(order.order.canceled_at).toLocaleTimeString()} </TableCell>
                          <TableCell align='right'>{order.order.terminated_at === null || order.order.terminated_at === undefined ? '-' : new Date(order.order.terminated_at).toLocaleTimeString()} </TableCell>
                        </Hidden>
                        <TableCell align='right' style={{color: status['color']}}> {status['status']} </TableCell>
                      </TableRow>
                      )
                    }
                  })}
                  </TableBody>
              </Table>
            </TableContainer>
            </Grid>
          </Grid>
    ); 
  }
}
export default withStyles(styles, { withTheme: true })(Order);