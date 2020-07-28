import React from 'react';
import { Container, Button, Grid, Table, TableBody, TableCell, TableSortLabel, TableContainer, TableHead, TableRow, Paper, Typography } from '@material-ui/core';
import {get} from '../utils/Api'
import { withStyles } from '@material-ui/core/styles';

const styles = {
  
}

class Market extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stocks:[],
      sorting_col: 'symbol',
      sorting_dir: 'desc'
    }
  }

  componentDidMount(){
    this.retrieve_market()
  }

  retrieve_market = async () => {
    get('api/retrieve_market/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        this.setState({'stocks': response.stocks})
      }
    })
  }

  renderStocks = () => {
    var stocks = this.state.stocks
    return(
      stocks.map((stock) => (
        <TableRow key={stock.symbol}>
          <TableCell component="th" scope="row"> {stock.symbol}  </TableCell>
          <TableCell component="th" scope="row" >{stock.name}</TableCell>
          <TableCell component="th" scope="row">{stock.sector} </TableCell>
          <TableCell component="th" scope="row">{stock.industry} </TableCell>
          <TableCell component="th" scope="row" align="right">{stock.last_price === null ? 'None' : stock.last_price.price_date} </TableCell>
          <TableCell component="th" scope="row" align="right">{stock.last_price === null ? 'None' : Math.round(stock.last_price.close)} </TableCell>
        </TableRow>
      ))
    )
  }

  sorter = (col, order) => {
    if (col !== 'backtest') {
      if (order === 'asc') {
        this.state.stocks.sort((a, b) => a[col].localeCompare(b[col]))
      } else {
        this.state.stocks.sort((a, b) => b[col].localeCompare(a[col]))
      }
    } else {
      if (order === 'asc') {
        this.state.stocks.sort(function(a, b) { return a[col].length - b[col].length } )
      } else {
        this.state.stocks.sort(function(a, b) { return b[col].length - a[col].length } )
      }
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

  update_stocks = () => {
    console.log('update_stock')
    get('api/update_stocks/').then((resp) => {
      if (resp.status === 200){
        var response = JSON.parse(resp.response)
        this.setState({'stocks': response.stocks})
        console.log(response.stocks)
      }
    })
  }

  render() {
    const { classes, theme } = this.props;
    return (
      <Container>
      <Grid container direction="row" alignItems="center" justify="center">
          <TableContainer component={Paper}>
            <Table aria-label="simple table" style={{tableLayout:'fixed', width:'100%'}}>
              <TableHead>
                <TableRow>
                  <TableCell> <Typography variant='body2'>Symbol</Typography>
                    <TableSortLabel active={this.state.sorting_col==='symbol'} direction={this.state.sorting_dir} id='symbol' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell > <Typography variant='body2'>Name</Typography>
                    <TableSortLabel active={this.state.sorting_col==='name'} direction={this.state.sorting_dir} id='name' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell ><Typography variant='body2'>Sector</Typography>
                    <TableSortLabel active={this.state.sorting_col==='sector'} direction={this.state.sorting_dir} id='sector' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell ><Typography variant='body2'>Industry</Typography>
                    <TableSortLabel active={this.state.sorting_col==='industry'} direction={this.state.sorting_dir} id='industry' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell align="right" ><Typography variant='body2'>Price date</Typography> </TableCell>
                  <TableCell align="right" ><Typography variant='body2'>Closing price</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.renderStocks()}
              </TableBody>
            </Table>
          </TableContainer>
      </Grid>
      </Container>
    )
  }
}

export default withStyles(styles, { withTheme: true })(Market);
