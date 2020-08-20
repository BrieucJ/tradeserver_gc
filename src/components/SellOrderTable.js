import React from 'react';
import { Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = {

}

class SellOrderTable extends React.Component {
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
            <Typography variant='h5' style={{display: 'inline-block', padding:5}}> Sell Orders </Typography>
                <TableContainer component={Paper} style={{ overflow: 'auto', height: '300px' }} >
                    <Table size="small" stickyHeader aria-label="sticky table" >
                    <TableHead>
                        <TableRow>
                            <TableCell>Ticker</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Model</TableCell>
                            <TableCell align="right">Price date</TableCell>
                            <TableCell align="right">Submited</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {portfolio.pending_sell_orders.map((so) => (
                        <TableRow key={so.id}>
                            <TableCell component="th" scope="row">{so.stock.symbol} </TableCell>
                            <TableCell component="th" scope="row">{so.stock.name.substring(0,20)} </TableCell>
                            <TableCell component="th" scope="row" style={{color: so.sma_position === null && 'red'}}> {so.sma_position === null ? 'None' : <Typography style={{display: 'inline-block'}} component='span' > {so.sma_position.model.low_sma} | <Typography component='span' style={{display: 'inline-block'}}> {so.sma_position.model.high_sma} </Typography> </Typography>}  </TableCell>
                            <TableCell component="th" scope="row">{so.sma_position === null ? 'None' : so.sma_position.price_date} </TableCell>
                            <TableCell align="right"> {so.submited_at === null ? 'Not sent' : new Date(so.submited_at).toLocaleString({timeZoneName:'short'})} </TableCell>
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

export default withStyles(styles, { withTheme: true })(SellOrderTable);