import React from 'react';
import { Button, Grid, Table, TableBody, TableCell, TableSortLabel, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';
import {get} from '../utils/Api'

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
        console.log(response.stocks)
      }
    })
  }

  renderStocks = () => {
    var stocks = this.state.stocks
    return(
      stocks.map((stock) => (
        <TableRow key={stock.symbol}>
          <TableCell component="th" scope="row">{stock.symbol} </TableCell>
          <TableCell component="th" scope="row">{stock.name} </TableCell>
          <TableCell component="th" scope="row">{stock.sector} </TableCell>
          <TableCell component="th" scope="row">{stock.industry} </TableCell>
          <TableCell component="th" scope="row" align="right">{stock.last_price.price_date} </TableCell>
          <TableCell component="th" scope="row" align="right">{Math.round(stock.last_price.close)} </TableCell>
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
    return (
      <Grid container direction="row" alignItems="center" justify="center">
           <Button
                type="submit"
                variant="contained"
                color="primary"
                onClick={() => {this.update_stocks()}}
                style={{margin: 10}}
            >
                Update stocks
            </Button>
          <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell style={{fontWeight:'bold'}}>Symbol
                    <TableSortLabel active={this.state.sorting_col==='symbol'} direction={this.state.sorting_dir} id='symbol' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell style={{fontWeight:'bold'}}>Name
                    <TableSortLabel active={this.state.sorting_col==='name'} direction={this.state.sorting_dir} id='name' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell style={{fontWeight:'bold'}}>Sector
                    <TableSortLabel active={this.state.sorting_col==='sector'} direction={this.state.sorting_dir} id='sector' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell style={{fontWeight:'bold'}}>Industry
                    <TableSortLabel active={this.state.sorting_col==='industry'} direction={this.state.sorting_dir} id='industry' onClick={e => {this.handleSorting(e)}} />
                  </TableCell>
                  <TableCell align="right" style={{fontWeight:'bold'}}>Last price date </TableCell>
                  <TableCell align="right" style={{fontWeight:'bold'}}>Last closing price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.renderStocks()}
              </TableBody>
            </Table>
          </TableContainer>
      </Grid>
    )
  }
}

export default Market
