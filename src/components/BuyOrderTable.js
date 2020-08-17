import React from 'react';
import { Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class BuyOrderTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
        active_index: 0
    };
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
                            <TableCell>Ticker</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Model</TableCell>
                            <TableCell align="right">Amount </TableCell>
                            <TableCell align="right">Order price </TableCell>
                            <TableCell align="right">Current price </TableCell>
                            <TableCell align="right">Submited</TableCell>
                            <TableCell align="right">Canceled</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {portfolio.pending_buy_orders.map((bo) => (
                        <TableRow key={bo.id}>
                            <TableCell component="th" scope="row">{bo.stock.symbol} </TableCell>
                            <TableCell component="th" scope="row">{bo.stock.name.substring(0,20)} </TableCell>
                            <TableCell component="th" scope="row" style={{color: bo.sma_position === null && 'red'}}> {bo.sma_position === null ? 'None' : <Typography component="span" style={{display: 'inline-block'}}> {bo.sma_position.model.low_sma} | <Typography component="span" style={{display: 'inline-block'}}> {bo.sma_position.model.high_sma} </Typography> </Typography>}  </TableCell>
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