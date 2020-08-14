import React from 'react';
import { Collapse, Box, Container, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel} from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class PortfolioTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
        active_index: 0
    };
  } 

  total_balance = (portfolio) => {
    var cash = portfolio.last_portfolio_history.cash
    var inv = portfolio.last_portfolio_history.total_invested_value
    return cash + inv
  }

  holding_duration = (open_date, close_date) => {
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
                            <TableSortLabel active={this.props.sorting_col==='symbol'} direction={this.props.sorting_dir} id='symbol' onClick={e => {this.props.handleSorting(e)}} />
                        </TableCell>
                        <TableCell>Name
                            <TableSortLabel active={this.props.sorting_col==='name'} direction={this.props.sorting_dir} id='name' onClick={e => {this.props.handleSorting(e)}} />
                        </TableCell>
                        <TableCell>Sector
                            <TableSortLabel active={this.props.sorting_col==='sector'} direction={this.props.sorting_dir} id='sector' onClick={e => {this.props.handleSorting(e)}} />
                        </TableCell>
                        <TableCell align="right">Amount 
                            <TableSortLabel active={this.props.sorting_col==='total_investment'} direction={this.props.sorting_dir} id='total_investment' onClick={e => {this.props.handleSorting(e)}} />
                        </TableCell>
                        <TableCell align="right">% 
                            <TableSortLabel active={this.props.sorting_col==='alloc_percentage'} direction={this.props.sorting_dir} id='alloc_percentage' onClick={e => {this.props.handleSorting(e)}} />
                        </TableCell>
                        <TableCell align="right">P/L $
                            <TableSortLabel active={this.props.sorting_col==='P_L'} direction={this.props.sorting_dir} id='P_L' onClick={e => {this.props.handleSorting(e)}} />
                        </TableCell>
                        <TableCell align="right">P/L %
                            <TableSortLabel active={this.props.sorting_col==='P_L'} direction={this.props.sorting_dir} id='P_L' onClick={e => {this.props.handleSorting(e)}} />
                        </TableCell>
                        <TableCell align="right">Duration
                            <TableSortLabel active={this.props.sorting_col==='open_date'} direction={this.props.sorting_dir} id='open_date' onClick={e => {this.props.handleSorting(e)}} />
                        </TableCell>
                        <TableCell> Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {portfolio.current_positions.map((po) => (
                        <React.Fragment key={po.id}>
                            <TableRow >
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
                                <TableCell align="right"> {this.holding_duration(po.open_date, new Date())} </TableCell>
                                <TableCell>
                                <IconButton aria-label="expand row" size="small" onClick={() => this.props.handleOpen(po.id)}>
                                    {this.props.open_id === po.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                                    <Collapse in={this.props.open_id == po.id} timeout="auto" unmountOnExit>
                                        <Box margin={1} style={{backgroundColor:'red'}}>
                                            <Typography >
                                                Model: {po.model === null ? 'None' : po.model}
                                            </Typography>
                                            <Typography >
                                                Buy order: {po.buy_order === null ? 'None' : po.buy_order}
                                            </Typography>
                                            <Typography >
                                                Sell order: {po.sell_order === null ? 'None' : po.sell_order}
                                            </Typography>
                                            <Typography >
                                                SMA position: {po.sma_position === null ? 'None' : po.sma_position}
                                            </Typography>
                                        </Box>
                                    </Collapse>
                                </TableCell>
                            </TableRow>
                        </React.Fragment>
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
