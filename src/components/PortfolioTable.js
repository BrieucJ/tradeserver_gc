import React from 'react';
import { Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class PortfolioTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
        sorting_col: 'total_investment',
        sorting_dir: 'asc',
    };
  } 

  total_balance = (portfolio) => {
    var cash = portfolio.last_portfolio_history.cash
    var inv = portfolio.last_portfolio_history.total_invested_value
    return cash + inv
  }

  holding_duration = (open_date, close_date) => {
    console.log(open_date)
    console.log(close_date)
    var delta = Math.abs(new Date(open_date) - new Date(close_date)) / 1000;
    // calculate (and subtract) whole days
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;
    // calculate (and subtract) whole hours
    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;
    
    if (days < 1){
      return `${(hours/24).toLocaleString(undefined, {maximumFractionDigits: 2})} day` 
    } else {
      return `${days},${(hours/24).toLocaleString(undefined, {maximumFractionDigits: 0})} day(s)` 
    }
  }

  name_sorter = (col, order) => {
    if (order === 'asc') {
        this.props.portfolio.current_positions.sort((a, b) => a.stock[col].localeCompare(b.stock[col]))
    } else {
        this.props.portfolio.current_positions.sort((a, b) => b.stock[col].localeCompare(a.stock[col]))
    }
  }

  number_sorter = (col, order) => {
    if (order === 'asc') {
        this.props.portfolio.current_positions.sort((a,b) => a[col] < b[col] ? 1 : -1)
    } else {
        this.props.portfolio.current_positions.sort((a,b) => a[col] > b[col] ? 1 : -1)
    }
  }

  p_l_sorter = (col, order) => {
    if (order === 'asc') {
        this.props.portfolio.current_positions.sort((a,b) => ((a.current_rate - a.open_rate) * a.num_of_shares) < ((b.current_rate - b.open_rate) * b.num_of_shares) ? 1 : -1)
    } else {
        this.props.portfolio.current_positions.sort((a,b) => ((a.current_rate - a.open_rate) * a.num_of_shares) > ((b.current_rate - b.open_rate) * b.num_of_shares) ? 1 : -1)
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
        case 'sector':
            this.name_sorter(col, order)
            break;
        case 'total_investment':
            this.number_sorter(col, order)
            break;
        case 'alloc_percentage':
            this.number_sorter('total_investment', order)
            break;
        case 'P_L':
            this.p_l_sorter(col, order)
            break;
        case 'open_date':
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

  handleOpen = async (id) => {
    if (id === this.state.open_id){
      this.setState({open_id: null})
    } else {
      this.setState({open_id: id})
      this.props.retrieve_history_details(id)
    }
  }

  render() {
    const { classes, theme, portfolio} = this.props;
    var date_time = new Date();
    var day_num = date_time.getDay()

    if (day_num === 0 || day_num === 6 || day_num === 1){
      if (day_num === 1){
        date_time.setDate(date_time.getDate() - 3);
      }
      if (day_num === 0){
        date_time.setDate(date_time.getDate() - 2);
      }
      if (day_num === 6){
        date_time.setDate(date_time.getDate() - 1);
      }
    } else {
      date_time.setDate(date_time.getDate() - 1);
    }

    var day = date_time.getDate()
    var month = date_time.getMonth() + 1 //January is 0!
    var year = date_time.getFullYear();
    var last_business_day = year + '-' + ('0' + month).slice(-2) + '-' + ('0' + day).slice(-2);

    return (
        <Grid item xs={12} sm={12} >
            <Paper style={{padding:5}}>
            <Typography variant='h5' style={{display: 'inline-block', padding:5}}> Portfolio </Typography>
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
                        <TableCell>Sector
                            <TableSortLabel active={this.state.sorting_col==='sector'} direction={this.state.sorting_dir} id='sector' onClick={e => {this.handleSorting(e)}} />
                        </TableCell>
                        <TableCell align="right">Amount 
                            <TableSortLabel active={this.state.sorting_col==='total_investment'} direction={this.state.sorting_dir} id='total_investment' onClick={e => {this.handleSorting(e)}} />
                        </TableCell>
                        <TableCell align="right">% 
                            <TableSortLabel active={this.state.sorting_col==='alloc_percentage'} direction={this.state.sorting_dir} id='alloc_percentage' onClick={e => {this.handleSorting(e)}} />
                        </TableCell>
                        <TableCell align="right">P/L $
                            <TableSortLabel active={this.state.sorting_col==='P_L'} direction={this.state.sorting_dir} id='P_L' onClick={e => {this.handleSorting(e)}} />
                        </TableCell>
                        <TableCell align="right">P/L %
                            <TableSortLabel active={this.state.sorting_col==='P_L'} direction={this.state.sorting_dir} id='P_L' onClick={e => {this.handleSorting(e)}} />
                        </TableCell>
                        <TableCell align="right">Duration
                            <TableSortLabel active={this.state.sorting_col==='open_date'} direction={this.state.sorting_dir} id='open_date' onClick={e => {this.handleSorting(e)}} />
                        </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {portfolio.current_positions.map((po) => (
                            <TableRow hover key={po.id} onClick={() => {this.props.history.push('/position/?id='+po.id)}}>
                                <TableCell component="th" scope="row">{po.stock.symbol.substring(0,20)}  </TableCell>
                                <TableCell component="th" scope="row">{po.stock.name.substring(0,20)}  </TableCell>
                                <TableCell scope="row">{po.stock.sector}  </TableCell>
                                <TableCell align="right"> {po.total_investment.toLocaleString(undefined, {maximumFractionDigits: 0 })} </TableCell>
                                <TableCell align="right"> { ((po.total_investment / this.total_balance(portfolio.portfolio)) * 100).toFixed(2)}% </TableCell>
                                <TableCell align="right" style={{color: po.current_rate > po.open_rate ? 'green' : 'red'}} > 
                                {((po.current_rate - po.open_rate) * po.num_of_shares).toLocaleString(undefined, {maximumFractionDigits: 0 })}
                                </TableCell>
                                <TableCell align="right" style={{color: po.current_rate > po.open_rate ? 'green' : 'red'}} >
                                    {((po.current_rate/po.open_rate-1)*100).toFixed(2)}%
                                </TableCell>
                                <TableCell align="right" style={{color: po.open_date === null && 'red'}}> {po.open_date === null ? 'None' : this.holding_duration(po.open_date, new Date())} </TableCell>
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

export default withStyles(styles, { withTheme: true })(PortfolioTable);