import React from 'react';
import { Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class BuyOrderTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
        sorting_col: 'total_investment',
        sorting_dir: 'asc',
    };
  } 

  name_sorter = (col, order) => {
    if (order === 'asc') {
        this.props.portfolio.pending_buy_orders.sort((a, b) => a.stock[col].localeCompare(b.stock[col]))
    } else {
        this.props.portfolio.pending_buy_orders.sort((a, b) => b.stock[col].localeCompare(a.stock[col]))
    }
  }

  number_sorter = (col, order) => {
    if (order === 'asc') {
        this.props.portfolio.pending_buy_orders.sort((a,b) => a[col] < b[col] ? 1 : -1)
    } else {
        this.props.portfolio.pending_buy_orders.sort((a,b) => a[col] > b[col] ? 1 : -1)
    }
  }

  p_l_sorter = (col, order) => {
    if (order === 'asc') {
        this.props.portfolio.pending_buy_orders.sort((a,b) => ((a.current_rate - a.open_rate) * a.num_of_shares) < ((b.current_rate - b.open_rate) * b.num_of_shares) ? 1 : -1)
    } else {
        this.props.portfolio.pending_buy_orders.sort((a,b) => ((a.current_rate - a.open_rate) * a.num_of_shares) > ((b.current_rate - b.open_rate) * b.num_of_shares) ? 1 : -1)
    }
  }

  sorter = (col, order) => {
    console.log('sorter')
    switch (col) {
        case 'symbol':
            this.name_sorter(col, order)
        break;
        case 'name':
            this.name_sorter(col, order)
            break;
        case 'total_investment':
            this.number_sorter(col, order)
            break;
        case 'price_date':
            this.number_sorter(col, order)
            break;
        case 'order_rate':
            this.number_sorter(col, order)
            break;
        case 'current_rate':
            this.number_sorter(col, order)
            break;
        case 'submited_at':
            this.number_sorter(col, order)
            break;
        case 'canceled_at':
            this.number_sorter(col, order)
            break;
        default:
            console.log('Unknown col');
    }
  }

  handleSorting = (e) => {
    if (this.state.sorting_dir === 'asc') {
      this.sorter(e.currentTarget.id, 'desc')
      this.setState({sorting_col: e.currentTarget.id, sorting_dir:'desc'})
    } else {
      this.sorter(e.currentTarget.id, 'asc')
      this.setState({sorting_col: e.currentTarget.id, sorting_dir:'asc'})
    }
  }

  render() {
    const { classes, theme, portfolio} = this.props;
    return (
        <Grid item xs={12} sm={12} >
            <Paper style={{padding:5}}>
            <Typography variant='h5' style={{display: 'inline-block', padding:5}}> Buy Orders </Typography>
                <TableContainer component={Paper} style={{ overflow: 'auto', height: '300px' }} >
                    <Table size="small" stickyHeader aria-label="sticky table" >
                    <TableHead>
                        <TableRow>
                            <TableCell>Ticker
                                <TableSortLabel active={this.state.sorting_col==='symbol'} direction={this.state.sorting_dir} id='symbol' onClick={e => {this.handleSorting(e)}} />
                            </TableCell>
                            <TableCell>Name
                                <TableSortLabel active={this.state.sorting_col==='name'} direction={this.state.sorting_dir} id='name' onClick={e => {this.handleSorting(e)}} />
                            </TableCell>
                            <TableCell>Price date
                                <TableSortLabel active={this.state.sorting_col==='price_date'} direction={this.state.sorting_dir} id='price_date' onClick={e => {this.handleSorting(e)}} />
                            </TableCell>
                            <TableCell>Model </TableCell>
                            <TableCell align="right">Amount 
                                <TableSortLabel active={this.state.sorting_col==='total_investment'} direction={this.state.sorting_dir} id='total_investment' onClick={e => {this.handleSorting(e)}} />
                            </TableCell>
                            <TableCell align="right">Order price
                                <TableSortLabel active={this.state.sorting_col==='order_rate'} direction={this.state.sorting_dir} id='order_rate' onClick={e => {this.handleSorting(e)}} />
                            </TableCell>
                            <TableCell align="right">Current price
                                <TableSortLabel active={this.state.sorting_col==='current_rate'} direction={this.state.sorting_dir} id='current_rate' onClick={e => {this.handleSorting(e)}} />
                            </TableCell>
                            <TableCell align="right">Submited
                                <TableSortLabel active={this.state.sorting_col==='submited_at'} direction={this.state.sorting_dir} id='submited_at' onClick={e => {this.handleSorting(e)}} />
                            </TableCell>
                            <TableCell align="right">Canceled
                                <TableSortLabel active={this.state.sorting_col==='canceled_at'} direction={this.state.sorting_dir} id='canceled_at' onClick={e => {this.handleSorting(e)}} />
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {portfolio.pending_buy_orders.map((bo) => (
                        <TableRow key={bo.id} hover onClick={() => {this.props.history.push('/buy_order/?id='+bo.id)}}>
                            <TableCell component="th" scope="row">{bo.stock.symbol} </TableCell>
                            <TableCell component="th" scope="row">{bo.stock.name.substring(0,20)} </TableCell>
                            <TableCell component="th" scope="row">{bo.price_date} </TableCell>
                            <TableCell component="th" scope="row" style={{color: bo.sma_position === null && 'red'}}> {bo.sma_position === null ? 'None' : <Typography component="span" variant='body2' style={{display: 'inline-block'}}> {bo.sma_position.model.low_sma} | <Typography variant='body2' component="span" style={{display: 'inline-block'}}> {bo.sma_position.model.high_sma} </Typography> </Typography>}  </TableCell>
                            <TableCell align="right"> {bo.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                            <TableCell align="right"> {bo.order_rate.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                            <TableCell align="right"> {bo.current_rate.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                            <TableCell align="right"> {bo.submited_at === null ? 'Not sent' : new Date(bo.submited_at).toLocaleString({timeZoneName:'short'})} </TableCell>
                            <TableCell align="right"> {bo.canceled_at === null ? '-' : new Date(bo.canceled_at).toLocaleString({timeZoneName:'short'})} </TableCell>
                        </TableRow>
                        ))}
                        </TableBody>
                    </Table>
            </TableContainer>
            </Paper>
        </Grid>
    ); 
  }
}

export default withStyles(styles, { withTheme: true })(BuyOrderTable);